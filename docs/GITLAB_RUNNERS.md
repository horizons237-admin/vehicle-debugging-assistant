# GitLab runners — optimization guide (VDA)

## Pipeline optimizations (`.gitlab-ci.yml`)

| Technique | Effect |
|-----------|--------|
| `GIT_DEPTH: 20` | Faster clone |
| `needs: []` / DAG | Jobs start as soon as dependencies finish |
| npm + pip **cache** | Avoid full dependency downloads |
| Artifacts = `out/` only (not `node_modules`) | Less transfer between jobs |
| `package:vsix` auto on default branch/tags; **manual** on MR | Saves runner minutes |
| `interruptible: true` | Cancel obsolete pipelines |
| `retry` on system failures | Resilience |
| slim images | Faster pull, less disk |
| Job `timeout` | Fail fast, free the runner |

## Recommended `config.toml` (Docker executor)

```toml
concurrent = 4
check_interval = 3

[[runners]]
  name = "vda-docker"
  url = "https://gitlab.example.com/"
  token = "…"
  executor = "docker"
  limit = 2

  [runners.docker]
    image = "alpine:3.20"
    privileged = false
    disable_cache = false
    volumes = ["/cache"]
    memory = "2g"
    cpus = "2"
    pull_policy = "if-not-present"

  [runners.cache]
    Type = "local"
    Path = "/cache"
    Shared = true
```

## Project settings

1. Auto-cancel redundant pipelines: **ON**
2. Shallow clone depth **20**
3. Optional job `tags: ["docker"]` to pin a runner

## What runs when

| Event | compile / test / validate | package:vsix | release |
|-------|---------------------------|--------------|---------|
| Merge request | yes | manual | no |
| Default branch | yes | yes | no |
| Tag `v*` | yes | yes | yes |
| Web (manual) | yes | yes | no |

## Safety

No `privileged = true` required. Do not mount the Docker socket without a hardening review.
