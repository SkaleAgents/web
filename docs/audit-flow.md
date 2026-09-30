# Audit creation and history

## Approved flow

Keep audit creation on one page, in this order:

1. Configuration: paste Terraform, CloudFormation, or Kubernetes input.
2. Review checks: select one or more review areas.
3. Start audit: submit once and open the new audit's status and results.

Telemetry and paired source revision/observation time are optional and collapsed
under Advanced options. Existing audit details show progress, findings,
recommended actions, and coverage. JSON download remains optional.

## Acceptance

- Starting is disabled until configuration and at least one review area exist.
- Pending submission disables editing and duplicate starts.
- Validation or server failure keeps the entered configuration and selections.
- Successful submission navigates directly to the returned audit ID.
- Issues found includes any job with a positive recorded finding count, including
  incomplete jobs. Unknown results are not described as safe or clean.
- Form and history fit a 390px viewport without horizontal scrolling.

Browser coverage lives in audit-navigation, source-metadata, product-workflows,
and smoke specs. These mocked checks do not replace an owner review in production.
