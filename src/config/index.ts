import { range } from "ramda";

export const APP_DESC = "[magit-stats] - Your git repository statistics";
export const CHECK_GIT_DIR_CMD = `git status`;
export const COMMAND = "npx magit-stats ";
export const DAY_HOURS = range(0, 24);
export const GIT_LOG_CMD = `git log --all --pretty=format:'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "sanitized_subject_line": "%f",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'`;
export const GIT_LOG_ONLY_AUTHORS_CMD = `git log --pretty="format:%aN"`;
export const GIT_REMOTE_URL_CMD = "git config --get remote.origin.url";
export const MAX_HEAP_SIZE = 4096;
export const WEEK_DAYS = range(0, 7);
