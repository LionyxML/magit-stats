import { getGitLogStatsType } from "../";

export const generateHTMLReport = ({
  firstCommit,
  lastCommit,
  totalCommits,
}: getGitLogStatsType) => {
  return `
<!DOCTYPE html>
  <html>
  <head>
    <title>Repository Statistics</title>
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
