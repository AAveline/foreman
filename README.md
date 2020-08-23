## Why

Foreman is usefull to list and compare npm dependencies accross multiple repositories. Feed foreman with your projects, it will list project by project common dependencies, and their respective version.

## Installation

`npm i -g @karbonn/foreman`

## How to use

- Declare a json file (your-file.json):
  `{ "project-a": "/path/to/project-a", "project-b": "/path/to/project-b" }`

- Run Foreman:
  `foreman -f /path/your-file.json`
