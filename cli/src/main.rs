use clap::{Arg, Command};

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

fn main() {
    let args = get_args();

    check_options_are_valid(&args);

    println!("Noice, valid options...");

    println!("{:?}", args);
}
