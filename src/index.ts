#! /usr/bin/env node

import { writeFile } from "fs";
import open from "open";
import { format } from "prettier";
import {
  applySpec,
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
import _yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { APP_DESC, COMMAND, DAY_HOURS, WEEK_DAYS } from "./config";
import {
  checkIsInsideGitDir,
  generateDateObj,
  getGitLog,
  logError,
  logMsg,
  mapIndexed,
} from "./utils";
import { generateHTMLReport } from "./htmlReport";

const yargs = _yargs(hideBin(process.argv));

export type getGitLogStatsType = ReturnType<typeof getGitLogStats>;

const getGitLogStats = () => {
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
        pathEq(["author", "name"], prop("name", author)),
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

  return {
    totalCommits,
    authors,
    commitsByAuthor,
    commitsByDayHour,
    commitsByWeekDay,
    firstCommit,
    lastCommit,
  };
};

const processOutput = (stats: any, argv: any) => {
  const argvKeys = Object.keys(argv);

  if (!(argvKeys.includes("json") || argvKeys.includes("stdout") || argvKeys.includes("html"))) {
    logError("Error: You should choose an option, such as --html, --json or --stdout.");
    logError(`Check all the options with: ${COMMAND} --help`);
    process.exit(-1);
  }

  const isMinified = argv.minify;

  if (argv.stdout) logMsg(JSON.stringify(stats, null, isMinified ? 0 : 2));

  if (argv.json)
    writeFile(argv.json, JSON.stringify(stats, null, isMinified ? 0 : 2), (error) => {
      if (error) {
        logError(error.message);
        process.exit(-1);
      }
    });

  const htmlReport = generateHTMLReport(stats);
  if (argv.html) {
    writeFile(argv.html, htmlReport, (error) => {
      // TODO: Minify it with prettier
      if (error) {
        logError(error.message);
        process.exit(-1);
      }
    });
    logMsg(`Stats report generated and saved to ${argv.html}`);

    if (!(argv.open === false)) open(argv.html);
  }
};

const getArgs = () =>
  yargs
    .usage(`${APP_DESC}\n`)
    .usage(`Usage: ${COMMAND} [options]`)
    .option("html", { type: "string", default: "git-stats.html" })
    .alias("l", "html")
    .nargs(".", 1)
    .describe("l", "Saves a HTML stats report")
    .example(`${COMMAND}`, "save report to git-stats.html")
    .example(`${COMMAND} [--html | -l] file.html`, "save report to file.html")
    .option("no-open", { type: "boolean" })
    .describe("no-open", "Does not open the generate HTML file")
    .option("json", { type: "string" })
    .alias("j", "json")
    .nargs("j", 1)
    .describe("j", "Saves JSON to file")
    .example(`${COMMAND} --json stats.json`, "save stats to JSON file")
    .option("stdout", { type: "boolean" })
    .alias("s", "stdout")
    .describe("s", "Prints stats to stdout")
    .example(`${COMMAND} --stdout`, "prints to stdout")
    .option("minify", { type: "boolean" })
    .alias("m", "minify")
    .describe("m", "JSON output is minified")
    .example(`${COMMAND} --stdout --minify`, "prints to stdout minified")
    .help("h")
    .alias("h", "help")
    .describe("h", "Show help")
    .alias("v", "version")
    .describe("version", "Show app version").argv;

const main = () => {
  checkIsInsideGitDir();

  const argv = getArgs();

  const stats = getGitLogStats();

  processOutput(stats, argv);
};

main();
