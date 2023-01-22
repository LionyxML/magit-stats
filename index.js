import { exec } from "child_process";
import prettier from "prettier";
import {
  pipe,
  map,
  uniq,
  prop,
  applySpec,
  filter,
  pathEq,
  zipWith,
  mergeWith,
  concat,
} from "ramda";

const APP_NAME = "magit-stats";
const CHECK_GIT_DIR_CMD = `git status`;
const GIT_LOG_CMD = `git log --pretty=format:'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "subject": "%s",%n  "sanitized_subject_line": "%f",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'`;

const logMsg = (msg) => console.log(`[${APP_NAME}]`, msg);
const logError = (msg) => console.error(`[${APP_NAME}]`, msg);

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

    const gitObject = JSON.parse(
      prettier.format(`[${stdout}]`, { parser: "json" })
    );

    const totalCommits = gitObject.length;

    const authors = pipe(
      map(prop("author")),
      map(
        applySpec({
          name: prop("name"),
          email: prop("email"),
        })
      ),
      uniq
    )(gitObject);

    const commitsByAuthor = pipe(
      map((author) => {
        const commits = filter(
          pathEq(["author", "name"], prop("name", author)),
          gitObject
        ).length;

        const percent = (commits / totalCommits) * 100;

        return {
          commits,
          percent,
        };
      }),
      zipWith(mergeWith(concat), authors)
    )(authors);

    logMsg({ totalCommits, authors, commitsByAuthor });
  });

const main = () => {
  logMsg("Getting repo stats...");
  checkIsInsideGitDir();
  getGitLogStats();
};

main();
