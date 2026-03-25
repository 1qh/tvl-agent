## Setup

- Uninstall `node` or deactivate it if you use `nvm` by running
  `nvm deactivate`, make sure `node -v` returns `command not found`
- Install [`bun`](https://bun.com)
- Get your `.env` file ready
- Prepare a Terminal multiplexer (like [`tmux`](https://github.com/tmux/tmux) or
  [`zellij`](https://zellij.dev)) to run multiple terminal sessions

### Running the App (choose 1 of 2 modes):

- Production mode: `docker compose up` (not recommended since I have not
  optimized for production yet, builds may take a while)

- Development mode (recommended):
  - Tab 1 (Services)

    ```bash
    docker compose up db redis s3 s3client
    ```
  - Tab 2 (Web App)

    ```bash
    bun i && bun db:push && bun run build && bun run --cwd apps/1 start
    ```