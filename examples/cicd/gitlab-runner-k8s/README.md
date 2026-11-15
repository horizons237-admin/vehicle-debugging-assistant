# GitLab Runner on Kubernetes (VDA)

## Quick start

```bash
kubectl apply -f namespace.yaml

helm repo add gitlab https://charts.gitlab.io
helm repo update
helm upgrade --install vda-runner gitlab/gitlab-runner \
  -n gitlab-runner \
  -f values.yaml \
  --set runnerToken="glrt-YOUR_TOKEN" \
  --set gitlabUrl="https://gitlab.example.com/"
```

Optional cache PVC: `kubectl apply -f cache-pvc.yaml` (requires RWX StorageClass).

## Runner token

GitLab → Settings → CI/CD → Runners → New runner  
Tags: `k8s`, `vda`, `kubernetes`

## Verify

```bash
kubectl -n gitlab-runner get pods
```

## Pin jobs

```yaml
default:
  tags: [k8s, vda]
```

Or leave `runUntagged: true` in values.yaml.
