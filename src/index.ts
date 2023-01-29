#! /usr/bin/env node

import { exec } from "child_process";
import * as prettier from "prettier";
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

const APP_NAME = "magit-stats";
const CHECK_GIT_DIR_CMD = `git status`;
const GIT_LOG_CMD = `git log --pretty=format:'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "subject": "%s",%n  "sanitized_subject_line": "%f",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'`;
const DAY_HOURS = range(0, 23);
const WEEK_DAYS = range(0, 7);

const logMsg = (msg: string | Object) => console.log(`[${APP_NAME}]`, msg);
const logError = (msg: string | Object) => console.error(`[${APP_NAME}]`, msg);

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

const getGitLogStats = () =>
  exec(GIT_LOG_CMD, (error, stdout, stderr) => {
    if (error) {
      logError(error.message);
      process.exit(-1);
    }
    if (stderr) {
      logError(stderr);
      process.exit(-1);
    }

    const commits = pipe(
      (stdout) => prettier.format(`[${stdout}]`, { parser: "json" }),
      JSON.parse,
      map((commit: Object) => ({
        ...commit,
        date: generateDateObj(pathOr("", ["author", "date"], commit)),
      })),
    )(stdout);

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
      pathOr(0, [0, "year"], commitDatesSorted),
      pathOr(0, [0, "month"], commitDatesSorted),
      pathOr(0, [0, "day"], commitDatesSorted),
    ).toDateString();

    const lastCommit = new Date(
      pathOr(0, [-1, "year"], commitDatesSorted),
      pathOr(0, [-1, "month"], commitDatesSorted),
      pathOr(0, [-1, "day"], commitDatesSorted),
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

    logMsg(repoStats);
  });

const main = () => {
  logMsg("Getting repository log...");
  checkIsInsideGitDir();
  logMsg("Calculating stats...");
  getGitLogStats();
};

main();
