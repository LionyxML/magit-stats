#! /usr/bin/env node

import { exec, execSync } from "child_process";
import { writeFile } from "fs";
import { format } from "prettier";
import {
  addIndex,
  applySpec,
  concat,
  count,
  descend,
  filter,
  map,
  mergeWith,
  pathOr,
  pathEq,
  pipe,
  prop,
  range,
  sortWith,
  uniq,
  zipWith,
} from "ramda";
import _yargs from "yargs";
import { hideBin } from "yargs/helpers";

const yargs = _yargs(hideBin(process.argv));

const APP_DESC = "[magit-stats] - Your git repository statistics";
const COMMAND = "npx magit-stats ";
const CHECK_GIT_DIR_CMD = `git status`;
const GIT_LOG_CMD = `git log --pretty=format:'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "sanitized_subject_line": "%f",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'`;
const DAY_HOURS = range(0, 24);
const WEEK_DAYS = range(0, 7);

const logMsg = (msg: string | object) => console.log(msg);
const logError = (msg: string | object) => console.error(msg);

const mapIndexed = addIndex(map);

const generateDateObj = (dateRFC: string) => {
  const date = new Date(dateRFC);

  return {
    month: date.getMonth(),
    day: date.getDate(),
    year: date.getFullYear(),
    hour: date.getHours(),
    weekDay: date.getDay(),
  };
};

const checkIsInsideGitDir = () =>
  exec(CHECK_GIT_DIR_CMD, (error) => {
    if (error) {
      logError(error.message);
      process.exit(-1);
    }
  });

const getGitLogStats = () => {
  // HACK: maxBuffer undefined is not documented and may stop working out of nowhere
  const gitLogOutput = execSync(GIT_LOG_CMD, { maxBuffer: undefined });

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

  const repoStats = {
    totalCommits,
    authors,
    commitsByAuthor,
    commitsByDayHour,
    commitsByWeekDay,
    firstCommit,
    lastCommit,
  };

  return repoStats;
};

const getArgs = () =>
  yargs
    .usage(`${APP_DESC}\n`)
    .usage(`Usage: ${COMMAND} [options]`)
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
    .describe("m", "JSON or stdout output is minified")
    .example(`${COMMAND} --stdout --minify`, "prints to stdout minified")
    .help("h")
    .alias("h", "help")
    .alias("v", "version").argv;

const processOutput = (stats: any, argv: any) => {
  if (!(Object.keys(argv).includes("json") || Object.keys(argv).includes("stdout"))) {
    logError("Error: You should choose at least --json or --stdout.");
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
};

const main = () => {
  // TODO: this looks like it should be a pipe
  checkIsInsideGitDir();

  const argv = getArgs();
  const stats = getGitLogStats();
  processOutput(stats, argv);
};

main();
