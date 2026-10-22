# Phase 49 Context: Azure Container Apps Job Pilot & Cloud Benchmarking

## 1. Cloud Pilot Scope
- Deploy the standalone worker container image to Azure Container Registry (ACR) and configure an on-demand Azure Container Apps (ACA) Job.
- Sizing: **1.0 vCPU, 2.0 GiB RAM**, scale-to-zero execution model, **max concurrency = 1**, **timeout = 120s**.
- Bounded Test Volume: **≤ 30 job executions** total during verification.
- Target Spend Ceiling: **₹500 maximum** (expected actual cost: < ₹5.00).

## 2. Measurable Cloud Metrics
- Measure actual cold-start time (seconds from job trigger to container start).
- Measure actual render duration on ACA hardware (vCPU bursting behavior).
- Measure real memory consumption (peak RSS under Linux container cgroups).
- Verify Supabase Storage persistence from the cloud worker environment.
- Confirm exact billing from Azure Cost Management.
