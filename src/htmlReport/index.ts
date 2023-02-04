import { getGitLogStatsType } from "../";
import { readFileSync } from "fs";
import * as path from "path";

export const generateHTMLReport = ({
  firstCommit,
  lastCommit,
  totalCommits,
}: getGitLogStatsType) => {
  const styles = readFileSync(new URL("../vendor/reset.css", import.meta.url));

  return `
<!DOCTYPE html>
  <html>
<head>
    <meta charset="UTF-8">
    <title>Repository Statistics</title>
<style>
${styles}
</style
  </head>

<body>
    <p>Total Commits: ${totalCommits}
    <p>First Commit: ${firstCommit}</p>
    <p>Last Commit: ${lastCommit}</p>
    <p>Generated at: ${new Date()}</p>
</body>
</html>
`;
};
