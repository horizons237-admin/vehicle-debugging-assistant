# GitLab runners on Kubernetes

Helm config: `examples/cicd/gitlab-runner-k8s/`.

## Architecture

```text
GitLab → Runner manager (Helm) → Job Pods (kubernetes executor)
```

## Install

```bash
kubectl apply -f examples/cicd/gitlab-runner-k8s/namespace.yaml
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install vda-runner gitlab/gitlab-runner \
  -n gitlab-runner \
  -f examples/cicd/gitlab-runner-k8s/values.yaml \
  --set gitlabUrl=https://gitlab.example.com/ \
  --set runnerToken=glrt-…
```

## CI resource variables

`.gitlab-ci.yml` sets `KUBERNETES_CPU_*` / `KUBERNETES_MEMORY_*` (and higher limits for `package:vsix`). Docker executors ignore these variables.

## Practices

- No privileged pods (VDA does not need DinD)
- Tags `k8s,vda` optional pin
- NetworkPolicy example for HTTPS/DNS egress
- Align `concurrent` with cluster capacity

See also [GITLAB_RUNNERS.md](./GITLAB_RUNNERS.md) for Docker executor hosts.
