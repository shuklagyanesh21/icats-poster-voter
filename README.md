🗳️ ICATS Poster Voter

A lightweight, mobile-friendly web app for collecting Best Poster Award votes at the International Conference for Advanced Technologies for Sustainable Food, Health, and Materials (ICATS).

The application is intentionally simple: attendees open a voting link, select their top three posters, and submit their ballot. Votes are collected through a Google Apps Script backend and stored in Google Sheets for final validation and tallying.

«Designed for a small conference audience (~120 attendees), not as a general-purpose election platform.»

---

✨ How it works

                ┌────────────────────┐
                │   Attendee opens   │
                │    voting link     │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Browse poster list │
                │ & choose top 3     │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   Submit ballot    │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Google Apps Script │
                │     backend        │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │    Google Sheet    │
                │   raw vote data    │
                └─────────┬──────────┘
                          │
                   Voting closes
                          │
                          ▼
                ┌────────────────────┐
                │ Validate against   │
                │ attendee registry  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   Final tally &    │
                │     winner 🏆      │
                └────────────────────┘

The frontend is hosted as a static site using GitHub Pages. No dedicated server is required.

---

🎯 Voting rules

Each attendee selects three different posters:

Rank| Meaning
🥇 1st choice| Highest preference
🥈 2nd choice| Second preference
🥉 3rd choice| Third preference

The application prevents selecting the same poster multiple times within a ballot.

The exact scoring/tallying procedure is performed by the conference organizers after voting closes.

---

🔐 A note on voting security

This application is designed for conference poster voting, rather than a high-security election.

The voting endpoint is intentionally accessible from the public internet so attendees can submit votes without requiring a Google account or login.

What the application does

- Validates the structure of submitted ballots
- Ensures exactly three poster choices are provided
- Ensures poster IDs are valid
- Prevents the same poster from being selected more than once in a ballot
- Records submission time
- Uses browser "localStorage" to discourage accidental repeat submissions
- Stores submissions in a private Google Sheet

What it does not attempt to do

The application does not provide cryptographic voter authentication or guarantee one-person-one-vote at the API level.

Instead, voter eligibility and duplicate submissions are reconciled after voting closes.

The raw submissions are compared against the official conference attendee/registration list. Duplicate or otherwise invalid submissions can then be excluded before the final tally.

For a small conference of approximately 120 attendees, this provides a simple and practical workflow without introducing unnecessary authentication infrastructure.

«Important: The Google Apps Script endpoint URL is public by design. It should therefore never be treated as a secret or credential.»

---

🛡️ Validation workflow

After voting closes, organizers should reconcile the raw vote data against the registered attendee list.

Typical checks include:

- Is the submitted name a registered attendee?
- Has the attendee submitted more than one ballot?
- Are all three poster choices valid?
- Are the three choices distinct?
- Are there unusual or clearly malformed submissions?

The recommended approach is to preserve the original raw vote data and create a validated/final dataset rather than deleting submissions.

Duplicate policy

Before the event, organizers should decide how duplicate submissions will be handled.

For example:

«If multiple ballots are submitted under the same attendee name, the earliest valid ballot is counted and subsequent submissions are excluded.»

The chosen rule should be applied consistently to all attendees.

---

🏗️ Architecture

The project consists of two lightweight components.

Frontend

GitHub Pages
    │
    ├── HTML
    ├── CSS
    ├── JavaScript
    └── conference poster data

The frontend is static and does not contain access to the Google Sheet itself.

Backend

Google Apps Script
        │
        ▼
   Google Sheets

The Apps Script Web App receives ballot submissions and appends them to the voting spreadsheet.

This keeps the Google Sheet private while allowing the public voting page to submit ballots.

---

📁 Repository structure

.
├── index.html              # Main voting interface
├── config.js               # Frontend configuration
├── styles.css              # UI styling
│
├── js/
│   ├── app.js              # Voting interface logic
│   └── ...
│
├── data/
│   └── posters.json        # Poster information
│
├── apps-script/
│   └── Code.gs             # Google Apps Script backend
│
├── tools/
│   └── print-codes.html    # Utility for generating/printing materials
│
└── README.md

«The exact structure may evolve as the conference implementation changes.»

---

🚀 Deployment

1. Frontend

The frontend can be deployed directly through GitHub Pages.

No Node.js server or backend hosting is required.

Configure the frontend with the deployed Google Apps Script Web App endpoint.

2. Google Apps Script

Create a Google Apps Script project and deploy it as a Web App.

The backend should run under the organizer's Google account and write to the designated Google Sheet.

The spreadsheet itself should not be made publicly editable.

3. Configure posters

Update the poster metadata used by the frontend:

Poster ID
Poster title
Author(s)
Affiliation

The poster IDs used by the frontend must correspond to the IDs accepted by the Apps Script backend.

4. Test before deployment

Before the conference, test:

- Valid ballot submission
- Duplicate poster selection
- Invalid poster IDs
- Missing fields
- Empty names
- Very long names
- Multiple submissions
- Simultaneous submissions
- Closed voting state
- Google Sheet recording
- Mobile browsers
- Slow/unstable network conditions

---

📱 Designed for the conference floor

The interface is intentionally optimized for attendees using their phones.

The goal is:

«Scan → Browse → Choose → Submit → Done.»

No app installation is required.

No account creation is required.

No complicated registration process is required.

---

🔒 Privacy

The voting backend records information required for ballot validation and tallying, including the submitted attendee name, selected posters, and submission timestamp.

The Google Sheet containing raw votes should be accessible only to authorized conference organizers.

The collected information should be handled according to the conference's applicable privacy/data-handling requirements and retained only as long as necessary.

---

🧪 Technology

Built with deliberately boring technology:

- HTML / CSS / JavaScript — frontend
- GitHub Pages — static hosting
- Google Apps Script — lightweight serverless backend
- Google Sheets — vote storage

No database server.
No authentication service.
No framework required.

Because sometimes a conference voting system doesn't need Kubernetes. 😄

---

⚠️ Scope & limitations

This project is designed for small-scale event voting.

It is appropriate when:

- the voter pool is relatively small
- organizers can reconcile submissions against a registration list
- the award is not a legally or financially consequential election
- organizers control the final tally

It should not be considered suitable for:

- public elections
- anonymous high-stakes elections
- legally binding voting
- elections requiring strong voter authentication
- adversarial environments where participants have a strong incentive to manipulate results

---

🏆 Why this exists

Conference poster sessions often have an awkward gap between:

"Please vote for your favourite poster."

and

"Here's a complicated form requiring three logins and a 12-digit registration number."

This project aims for something simpler.

A participant should be able to walk around the poster session, decide which work impressed them, open a link on their phone, cast their three choices, and get back to the science.

The organizers can deal with the boring part—validation and tallying—afterwards.

---

📄 License

Add the project's license here if/when one is selected.

---

👤 Author

Gyanesh Shukla

Developed for poster-session voting at ICATS.

---

Status

🟢 Conference-ready for small-scale deployment

The system is intentionally lightweight and relies on post-voting reconciliation rather than attempting to implement a full authentication system.

If you're deploying this for a new event, review the configuration, voting rules, privacy requirements, and duplicate-handling policy before opening the voting window.
