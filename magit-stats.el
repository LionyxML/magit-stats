;;; magit-stats.el --- Generates GIT Repo Statistics Report -*- lexical-binding: t; -*-

;; Author: Rahul M. Juliato
;; Created: Jan 18 2023
;; Version: 0.0.1
;; Keywords: vc, convenience
;; URL: https://github.com/LionyxML/magit-stats
;; Package-Requires: ((emacs "25.1"))
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
;; To enable magit-stats, install the package and add it to your load path:
;;     (require 'magit-stats)
;;
;; Call it when inside a file inside a git repository with ~M-x magit-stats RET~
;;

;;; Code:
(require 'shr)

(defgroup magit-stats nil
  "Generates GIT Repo Statistics Report."
  :group 'tools
  :prefix "magit-stats-")

(defcustom magit-stats-backends
  '((?h magit-stats-in-buffer   "HTML report in a new buffer")
    (?o magit-stats-with-viewer "Open HTML report with OS default viewer")
    (?j magit-stats-json-buffer "JSON report data in a new buffer"))
  "List of backends for the `magit-stats' command.
Each entry is of form: (CHAR FN DESCRIPTION)"
  :type 'list)

;;;###autoload
(defun magit-stats-in-buffer ()
  "HTML report in a new buffer."
  (interactive)
  (with-current-buffer (get-buffer-create "*magit-stats-stdout*")
    (message "Loading...")
    (erase-buffer)
    (let ((process-status (call-process "npx" nil (get-buffer-create "*magit-stats-stdout*") nil "magit-stats" "--html" "--stdout")))
      (if (= process-status 0)
          (progn
            (shr-render-buffer (current-buffer))
            (pop-to-buffer (current-buffer))
            (kill-buffer "*magit-stats-stdout*")
            (message "Loaded!"))
        (error "Error while loading stats!")))))

;;;###autoload
(defun magit-stats-with-viewer ()
  "Open HTML report with OS default viewer."
  (interactive)
  (message "Loading...")
  (let ((process-status (call-process "npx" nil nil nil "magit-stats")))
    (if (= process-status 0)
        (message "Loaded!")
      (error "Error while loading stats!"))))

;;;###autoload
(defun magit-stats-json-buffer ()
  "JSON report data in a new buffer."
  (interactive)
  (with-current-buffer (get-buffer-create "*magit-stats-stdout*")
    (message "Loading...")
    (erase-buffer)
    (let ((process-status (call-process "npx" nil (get-buffer-create "*magit-stats-stdout*") nil "magit-stats" "--json" "--stdout")))
      (if (= process-status 0)
          (pop-to-buffer (current-buffer))
        (error "Error while loading stats!")))
    (message "Loaded!")))

;;;###autoload
(defun magit-stats (backend)
  "Generate GIT Repository Statistics via BACKEND."
  (interactive
   (list (car (alist-get (read-char-choice
                          (format "magit-stats backend (%s):\n%s"
                                  (substitute-command-keys "\\[keyboard-quit] to quit")
                                  (mapconcat (lambda (b) (format "%c - %s\n" (car b) (car (last b))))
                                             magit-stats-backends))
                          (mapcar #'car magit-stats-backends))
                         magit-stats-backends))))
  (if (functionp backend) (funcall backend) (user-error "Unknown backend: %s" backend)))

(provide 'magit-stats)

;;; magit-stats.el ends here
