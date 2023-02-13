import { execSync } from "child_process";
import path from "path";
import { addIndex, map, uniq } from "ramda";
import {
  CHECK_GIT_DIR_CMD,
  GIT_LOG_CMD,
  GIT_LOG_ONLY_AUTHORS_CMD,
  GIT_REMOTE_URL_CMD,
} from "../config";

export const logMsg = (msg: string | object) => console.log(msg);

export const logError = (msg: string | object) => console.error(msg);

export const mapIndexed = addIndex(map);

export const generateDateObj = (dateRFC: string) => {
  const date = new Date(dateRFC);

  return {
    month: date.getMonth(),
    day: date.getDate(),
    year: date.getFullYear(),
    hour: date.getHours(),
    weekDay: date.getDay(),
  };
};

export const checkIsInsideGitDir = () => {
  try {
    // HACK: maxBuffer undefined is not documented and may stop working out of nowhere
    execSync(CHECK_GIT_DIR_CMD, { maxBuffer: undefined });
  } catch {
    process.exit(-1);
  }
  return;
};

// HACK: maxBuffer undefined is not documented and may stop working out of nowhere
export const getGitLog = () => {
  try {
    const rawAuthors = execSync(GIT_LOG_ONLY_AUTHORS_CMD, { maxBuffer: undefined }).toString();
    const authorsArr = uniq(String(rawAuthors).split("\n"));
    const authorsSanitizedArr = authorsArr.map((name) => name.replace(/"/g, ""));

    const gitLog = String(execSync(GIT_LOG_CMD, { maxBuffer: undefined }));

    const gitLogSanitized = authorsArr.reduce((str, word, i) => {
      const pattern = new RegExp(word, "g");
      const isAuthorSanitized = authorsArr[i] !== authorsSanitizedArr[i];

      return isAuthorSanitized ? str.replace(pattern, authorsSanitizedArr[i]) : str;
    }, gitLog);

    return gitLogSanitized;
  } catch {
    process.exit(-1);
  }
};

export const getDirectoryName = (): string => String(path.basename(path.resolve(process.cwd())));

export const getGitRemoteURL = (): string => {
  try {
    return String(execSync(GIT_REMOTE_URL_CMD));
  } catch {
    process.exit(-1);
  }
};

export const weekDayName = (numDay: number): string =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][numDay];

export const weekDayNameShort = (numDay: number): string =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][numDay];

export const truncateString = (text: string, max: number): string =>
  text.substr(0, max - 1) + (text.length > max ? "…" : "");
