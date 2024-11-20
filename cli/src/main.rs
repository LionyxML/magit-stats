use clap::{Arg, Command};
use serde::Deserialize;
use serde_json;

const APP_DESC: &str = "A CLI utility for generating Git statis reports";
const COMMAND: &str = "git-stats";
const VERSION: &str = "0.2.0";

fn get_args() -> clap::ArgMatches {
    Command::new(COMMAND)
        .bin_name(COMMAND)
        .version(VERSION)
        .about(APP_DESC)
        .arg(
            Arg::new("html")
                .long("html")
                .help("Saves report to HTML file (default: git-stats.html)")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("json")
                .long("json")
                .help("Saves report to JSON file (default: git-stats.json)")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("stdout")
                .long("stdout")
                .help("Outputs to stdout")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("minify")
                .long("minify")
                .help("Minifies the JSON output")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("file")
                .long("file")
                .help("Output file name")
                .value_name("FILE"),
        )
        .arg(
            Arg::new("repo")
                .long("repo")
                .help("Repository name to show on report")
                .value_name("REPO"),
        )
        .arg(
            Arg::new("no-open")
                .long("no-open")
                .help("Does not auto-open the generated HTML file")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("no-icons")
                .long("no-icons")
                .help("Does not use icons on HTML")
                .action(clap::ArgAction::SetTrue),
        )
        .get_matches()
}

fn check_options_are_valid(args: &clap::ArgMatches) {
    if args.get_flag("json") && args.get_flag("html") {
        eprintln!("\nError: Options --json and --html cannot be used at the same time.\n");
        std::process::exit(1);
    }
}

fn get_git_log() -> String {
    let output = std::process::Command::new("git")
        .arg("log")
        .arg("--pretty=format:{\"author\":{\"name\":\"%an\",\"email\":\"%ae\",\"date\":\"%ad\"},\"message\":\"%s\"},")
        .output()
        .expect("Failed to execute git log");

    String::from_utf8(output.stdout).expect("Invalid UTF-8 output")
}

#[derive(Debug, Deserialize)]
struct Author {
    name: String,
    email: String,
    date: String,
}

#[derive(Debug, Deserialize)]
struct Commit {
    author: Author,
    message: String,
}

fn parse_git_log(log: &str) -> Vec<Commit> {
    let formatted = format!("[{}]", log.trim_end_matches(','));
    serde_json::from_str(&formatted).expect("Failed to parse JSON")
}

fn get_total_commits(commits: &[Commit]) -> usize {
    commits.len()
}

fn main() {
    let args = get_args();

    check_options_are_valid(&args);

    let log = get_git_log();
    let commits = parse_git_log(&log);

    // println!(">>> Commits: {:?}", commits);

    let total_commits = get_total_commits(&commits);

    println!(">>> Total Commits: {:?}", total_commits);


}
