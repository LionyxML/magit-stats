#! /usr/bin/env node

import { writeFile } from "fs";
import open from "open";
import { format } from "prettier";
import {
  applySpec,
  both,
  concat,
  count,
  descend,
  filter,
  map,
  mergeWith,
  pathEq,
  pathOr,
  pipe,
  prop,
  sortWith,
  uniq,
  zipWith,
} from "ramda";
import { setFlagsFromString } from "v8";
import _yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { APP_DESC, COMMAND, DAY_HOURS, MAX_HEAP_SIZE, WEEK_DAYS } from "./config";
import { generateHTMLReport } from "./htmlReport";
import {
  checkIsInsideGitDir,
  generateDateObj,
  getDirectoryName,
  getGitLog,
  getGitRemoteURL,
  logError,
  logMsg,
  mapIndexed,
} from "./utils";

const yargs = _yargs(hideBin(process.argv));

const checkOptionsAreValid = (argv: any) => {
  if (argv.json && argv.html) {
    logError("Options --json and --html cannot be used at the same time.");
    process.exit(-1);
  }
};

export type getGitLogStatsType = ReturnType<typeof getGitLogStats>;

const getGitLogStats = (argv: any) => {
  setFlagsFromString(`--max_old_space_size=${argv.heap}`);

  const gitLogOutput = getGitLog();

  const commits = pipe(
    (stdout) => format(`[${stdout}]`, { parser: "json" }),
    JSON.parse,
    map((commit: object) => ({
      ...commit,
      date: generateDateObj(pathOr("", ["author", "date"], commit)),
    })),
  )(gitLogOutput);

  const totalCommits = commits.length;

  const authors = pipe(
    map(prop("author")),
    map(
      applySpec({
        name: prop("name"),
        email: prop("email"),
      }),
    ),
    uniq,
  )(commits);

  const commitsByAuthor = pipe(
    map((author) => {
      const authorCommits = filter(
        both(
          pathEq(["author", "email"], prop("email", author)),
          pathEq(["author", "name"], prop("name", author)),
        ),
        commits,
      ).length;

      const authorCommitsShare = (authorCommits / totalCommits) * 100;

      return {
        authorCommits,
        authorCommitsShare,
      };
    }),
    zipWith(mergeWith(concat), authors),
    sortWith([descend(prop("authorCommits"))]),
  )(authors);

  const commitsByDayHour = pipe(
    map((hour) =>
      pipe(
        map(pathEq(["date", "hour"], hour)),
        count((hasCommit) => hasCommit),
      )(commits),
    ),
    mapIndexed((commits, hour) => ({ hour, commits })),
  )(DAY_HOURS);

  const commitsByWeekDay = pipe(
    map((day) =>
      pipe(
        map(pathEq(["date", "weekDay"], day)),
        count((hasCommit) => hasCommit),
      )(commits),
    ),
    mapIndexed((commits, weekDay) => ({ weekDay, commits })),
  )(WEEK_DAYS);

  const commitDatesSorted = pipe(
    map(prop("date")),
    sortWith([descend(pathOr("", ["year", "month", "day", "hour"]))]),
  )(commits);

  const firstCommit = new Date(
    pathOr(0, [-1, "year"], commitDatesSorted),
    pathOr(0, [-1, "month"], commitDatesSorted),
    pathOr(0, [-1, "day"], commitDatesSorted),
  ).toDateString();

  const lastCommit = new Date(
    pathOr(0, [0, "year"], commitDatesSorted),
    pathOr(0, [0, "month"], commitDatesSorted),
    pathOr(0, [0, "day"], commitDatesSorted),
  ).toDateString();

  const repositoryName = argv.repo ? argv.repo : getDirectoryName();

  const remoteURL = getGitRemoteURL();

  return {
    authors,
    commitsByAuthor,
    commitsByDayHour,
    commitsByWeekDay,
    firstCommit,
    lastCommit,
    remoteURL,
    repositoryName,
    totalCommits,
    htmlOptions: {
      noIcons: "icons" in argv,
    },
  };
};

const processOutput = (stats: any, argv: any) => {
  if (!argv.json && !argv.html) argv.html = true;

  const isMinified = argv.minify;

  const getFileName = () => {
    if (argv.file) return argv.file;
    if (argv.html) return "git-stats.html";
    if (argv.json) return "git-stats.json";
  };

  if (argv.html && argv.stdout) {
    const htmlReport = generateHTMLReport(stats);
    logMsg(htmlReport);
    return;
  }

  if (argv.html) {
    const htmlReport = generateHTMLReport(stats);
    writeFile(getFileName(), htmlReport, (error) => {
      if (error) {
        logError(error.message);
        process.exit(-1);
      }
    });
    if (!(argv.open === false)) open(getFileName());
    return;
  }

  if (argv.json && argv.stdout) {
    logMsg(JSON.stringify(stats, null, isMinified ? 0 : 2));
    return;
  }

  if (argv.json)
    writeFile(getFileName(), JSON.stringify(stats, null, isMinified ? 0 : 2), (error) => {
      if (error) {
        logError(error.message);
        process.exit(-1);
      }
    });
};

const getArgs = () =>
  yargs
    .usage(`${APP_DESC}\n`)
    .usage(`Usage: ${COMMAND} [options]`)
    .option("html", {
      type: "boolean",
      description: "Saves report to HTML file (default: git-stats.html)",
    })
    .option("json", {
      type: "boolean",
      description: "Saves report to JSON file (default: git-stats.json)",
    })
    .option("stdout", { type: "boolean", description: "Outputs to stdout" })
    .option("minify", { type: "boolean", description: "Minifies the JSON output" })
    .option("file", { type: "string", description: "Output file name" })
    .option("repo", { type: "string", description: "Repository name to show on report" })
    .option("no-open", {
      type: "boolean",
      description: "Does not auto-open the generate HTML file",
    })
    .option("no-icons", { type: "boolean", description: "Does not use icons on HTML" })
    .option("heap", {
      type: "string",
      default: MAX_HEAP_SIZE,
      nargs: 1,
      description: "Node memory heap size",
    })
    .help("h")
    .alias("h", "help")
    .describe("h", "Show help")
    .alias("v", "version")
    .describe("version", "Show app version")
    .example(`${COMMAND}`, "saves report to git-stats.html an opens the file with default app")
    .example(`${COMMAND} --html`, "same as above")
    .example(`${COMMAND} --html --file out.html`, "saves report to out.html and open it")
    .example(`${COMMAND} --html --no-open`, "saves report to git-stats.html")
    .example(`${COMMAND} --json`, "saves report to git-stats.json")
    .example(`${COMMAND} --json --file out.json`, "saves report to out.json")
    .example(`${COMMAND} --json --stdout`, "prints JSON report to stdout")
    .showHelpOnFail(true).argv;

const main = () => {
  const argv = getArgs();
  checkOptionsAreValid(argv);
  checkIsInsideGitDir();

  const stats = getGitLogStats(argv);
  processOutput(stats, argv);
};

main();
