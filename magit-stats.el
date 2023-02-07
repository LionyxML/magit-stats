;;; magit-stats.el --- Generates GIT Repo Statistics Report -*- lexical-binding: t; -*-

;; Author: Rahul M. Juliato
;; Created: Jan 18 2023
;; Version: 0.0.1
;; Keywords: vc, convenience
;; URL: https://github.com/LionyxML/magit-stats
;; Package-Requires: ((emacs "24.4"))
;; SPDX-License-Identifier: GPL-2.0-or-later

;;; Commentary:
;; magit-stats generates reports containing statistics of your GIT Repositories.
;;
;; It uses the ~magit-stats~ npm package CLI Tool for NodeJS.
;;
;; It requires your system to run ~npx~ and have NodeJS
;; (node@latest) installed.  Please first install it if not yet present
;; in your system (see: https://nodejs.org/en/ and
;; https://www.npmjs.com/package/npx)
;;
;; NOTE: This is not related to official Emacs ~magit~, please do not
;;       bother its creator who has been kind enough to point me on
;;       the directions of developing a magit plugin (maybe this in
;;       the future).
;;
;; To enable magit-stats, install the package and add it to your load path:
;;     (require 'magit-stats)
;;
;; Call it when inside a file inside a git repository with ~M-x magit-stats RET~
;;

;;; Code:
(defgroup magit-stats nil
  "Generates GIT Repo Statistics Report."
  :group 'tools
  :prefix "magit-stats-*")

(defcustom magit-stats-command-html-stdout "npx magit-stats --html --stdout"
  "Command to generate the HTML report to stdout."
  :group 'magit-stats
  :type 'string)

(defcustom magit-stats-command-html-open "npx magit-stats"
  "Command to generate the HTML report and open it."
  :group 'magit-stats
  :type 'string)

(defcustom magit-stats-command-html-json-stdout "npx magit-stats --json --stdout"
  "Command to generate the JSON report to stdout."
  :group 'magit-stats
  :type 'string)

(defun magit-stats ()
  "Generate GIT Repository Statistics."
  (interactive)
  (let ((choice (read-char-choice "
[magit-stats] (A NON Official maybe future magit plugin)

Choose an option:

a - Generate HTML report to a new buffer
b - Generate HTML report to a file and open on OS default viewer
c - Save JSON report data to a new buffer

q - Quit
" '(97 98 99 113))))
    (cond
     ((eq choice ?a)
      (with-current-buffer (get-buffer-create "*magit-stats-stdout*")
	(message "Loading...")
        (erase-buffer)
        (shell-command magit-stats-command-html-stdout (current-buffer))
        (shr-render-buffer (current-buffer))
        (pop-to-buffer (current-buffer))
	(kill-buffer "*magit-stats-stdout*")
	(message "Loaded!")))
     ((eq choice ?b)
      (message "Loading...")
      (shell-command  magit-stats-command-html-open)
      (message "Loaded!"))
     ((eq choice ?c)
      (with-current-buffer (get-buffer-create "*magit-stats-stdout*")
	(message "Loading...")
        (erase-buffer)
        (shell-command magit-stats-command-html-json-stdout (current-buffer))
        (pop-to-buffer (current-buffer))
	(message "Loaded!")))

     ((eq choice ?q)
      (message "Quitting [magit-stats]")))))

(provide 'magit-stats)

;;; magit-stats.el ends here
