# Actual GitHub screenshot evidence

Completed on 6 October 2026: the group supplied all four actual GitHub screenshots. The original local PNGs were visually matched to the supplied images and copied byte-for-byte into evidence/github. Appendix A contains the member metadata, full messages, dates and contribution summaries. Appendix B embeds the four screenshots on landscape pages.

Each supplied image shows the repository, commit message, account, short commit hash and changed files. Screenshots remain unedited; the PDF scales them proportionally. Exact author/committer timestamps are separately recorded in Appendix A. Screenshot capture times were not independently verified and are not invented; the manifest records the date supplied and original filenames.

| Member | Actual page shown | Original PNG preserved under evidence/github |
|---|---|---|
| Jathurshy.S / IT24103355 | https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/50f9414e8ceeb8f287112bde2a81883fa9ba4245 | Jathurshy-50f9414.png |
| M.Thanusikan / IT24103609 | https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/25de8a92bee86fe982b6fdbbe65afdc35055ce43 | Thanusikan-25de8a9.png |
| Denesh N / IT24102826 | https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/48a9c3b9cd87d67ce48b9c16aeb960be85baa266 | Denesh-48a9c3b.png |
| Deneshkar. P / IT24103828 | https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/3c059a63c9093f6347de4fbef73f9b3e7164910a | Deneshkar-3c059a6.png |

evidence/github/screenshots.json links every image to its member, full commit hash and GitHub URL, with dimensions, source filename, supplied date and SHA-256 checksum. The PDF builder checks the image checksum and member/commit mapping before embedding it. The ZIP contains the originals and the same repository mirror.

For Deneshkar's commit 3c059a6, GitHub shows Deneshkar as author and Jathurshy11 as committer. These are distinct Git roles. The PDF caption explains this and attributes the volunteer contribution to the recorded author.

To rebuild from the assignment root:

```powershell
python QMS/scripts/build_submission.py
python QMS/scripts/sync_repository.py
python QMS/scripts/package_submission.py
```

Inspect the rendered PDF after adding screenshots. Actual personal execution/review records remain separate from both Git authorship and screenshots. Members 1 to 3 supplied personal testing screenshots on 7 October; Personal_Execution_Evidence.md links their raw results. Own-word explanations and changed-input exercises remain pending.
