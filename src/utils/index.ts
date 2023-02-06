import { exec, execSync } from "child_process";
import { addIndex, map } from "ramda";
import { CHECK_GIT_DIR_CMD, GIT_LOG_CMD } from "../config";

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

export const checkIsInsideGitDir = () =>
  exec(CHECK_GIT_DIR_CMD, (error) => {
    if (error) {
      logError(error.message);
      process.exit(-1);
    }
  });

// HACK: maxBuffer undefined is not documented and may stop working out of nowhere
export const getGitLog = () => execSync(GIT_LOG_CMD, { maxBuffer: undefined });

export const weekDayName = (numDay: number): string =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][numDay];

export const weekDayNameShort = (numDay: number): string =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][numDay];
