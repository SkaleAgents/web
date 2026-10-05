export type PublicCheck = {
  slug: string;
  ruleId: string;
  area: "Security" | "Reliability" | "AI workloads" | "Scaling and cost";
  title: string;
  looksFor: string;
  needs: string;
  finding: string;
  limit: string;
  exampleLabel: string;
  example: string;
};

export const publicChecks: PublicCheck[] = [
  {
    slug: "public-network-access",
    ruleId: "iac.public-network-access",
    area: "Security",
    title: "Public network access",
    looksFor: "An unrestricted IPv4 range (0.0.0.0/0) or IPv6 range (::/0) used as a source outside an explicit egress rule.",
    needs: "Infrastructure text you paste in, such as Terraform or a Kubernetes manifest. The check reads that text only.",
    finding: "High severity. The suggested next step is to restrict ingress to approved ranges or trusted security groups.",
    limit: "A public range that appears only in a comment is not treated as an ingress rule. This check does not connect to a cloud account, and no finding does not prove the network is private.",
    exampleLabel: "Ingress that this check is written to notice",
    example: `ingress {
  cidr_blocks = ["0.0.0.0/0"]
}`,
  },
  {
    slug: "wildcard-iam-permissions",
    ruleId: "iac.wildcard-iam-action",
    area: "Security",
    title: "Wildcard IAM permissions",
    looksFor: "An unrestricted IAM action pattern in the supplied infrastructure text.",
    needs: "Infrastructure text that includes the permission statement. The check does not read an IAM console or account.",
    finding: "High severity. The suggested next step is to replace the wildcard with the smallest permission set the workload needs.",
    limit: "It cannot tell whether a wildcard is justified by a break-glass process outside the text you supplied.",
    exampleLabel: "Action pattern that this check is written to notice",
    example: `statement {
  actions = ["*"]
}`,
  },
  {
    slug: "elevated-container-privileges",
    ruleId: "iac.elevated-container-privileges",
    area: "Security",
    title: "Elevated container privileges",
    looksFor: "A Kubernetes manifest that enables a privileged execution setting.",
    needs: "The manifest text. The check does not inspect a running cluster.",
    finding: "Critical severity when the setting is present. The suggested next step is to remove it unless the workload needs it and is isolated on purpose.",
    limit: "A privileged setting that is not in the supplied manifest is outside this check.",
    exampleLabel: "Setting that this check is written to notice",
    example: `securityContext:
  privileged: true`,
  },
  {
    slug: "container-image-scan",
    ruleId: "iac.container-image-scan",
    area: "Security",
    title: "Container image scan",
    looksFor: "This check does not scan a container registry. It is listed so a review can say the image was not scanned.",
    needs: "No registry credentials are used. If the text names an image, the check is skipped because a scanner is not configured. If the text names no image, the check does not apply.",
    finding: "It does not produce an image vulnerability finding.",
    limit: "A completed security review can still show this check as skipped. That is expected. It is not a clean image report.",
    exampleLabel: "What a review should say",
    example: "Skipped. This check does not apply to the supplied input, or container image scanning is not configured.",
  },
  {
    slug: "error-rate",
    ruleId: "sre.elevated-error-rate",
    area: "Reliability",
    title: "Error rate",
    looksFor: "A supplied errorRate of 0.05 or higher.",
    needs: "Telemetry you include with the review, as a number on errorRate. There is no live metrics connection.",
    finding: "Medium below 0.2, and high at 0.2 or above. The suggested next step is to inspect failing requests, bound retries, and check alert thresholds.",
    limit: "If errorRate is missing, the check is skipped. It does not invent a rate from logs.",
    exampleLabel: "Telemetry field",
    example: `{ "errorRate": 0.05 }`,
  },
  {
    slug: "failed-scheduled-jobs",
    ruleId: "sre.failed-crons",
    area: "Reliability",
    title: "Failed scheduled jobs",
    looksFor: "A supplied failedCrons count greater than zero.",
    needs: "Telemetry you include, as a number on failedCrons.",
    finding: "Medium severity. The suggested next step is to read the failure logs and add retry or recovery where it belongs.",
    limit: "A count of zero is not a finding. A missing field skips the check.",
    exampleLabel: "Telemetry field",
    example: `{ "failedCrons": 2 }`,
  },
  {
    slug: "retry-and-timeout-patterns",
    ruleId: "sre.retry-pattern",
    area: "Reliability",
    title: "Retry and timeout patterns",
    looksFor: "A retryCount of 3 or more, or at least two log lines that mention a timeout, connection reset, retry exhaustion, retrying, or HTTP 429 or 503.",
    needs: "Telemetry you include: retryCount, a logs array of strings, or both.",
    finding: "Medium by default. High when retryCount is 10 or more, or when five or more of those log lines match. The suggested next step is to cap retries with backoff and check timeouts.",
    limit: "Unrelated log text does not count. Missing telemetry skips the check.",
    exampleLabel: "Telemetry fields",
    example: `{ "retryCount": 3, "logs": ["request timeout", "status 503"] }`,
  },
  {
    slug: "model-token-consumption",
    ruleId: "mlops.high-token-consumption",
    area: "AI workloads",
    title: "Model token consumption",
    looksFor: "A supplied tokenCount or tokens value of 100,000 or more.",
    needs: "Telemetry you include. The check does not call a model provider.",
    finding: "Medium below 1,000,000 tokens, and high at or above that. The suggested next step is to review prompt size, routing, caching, and per-request limits.",
    limit: "It does not decide whether the spend was worth it.",
    exampleLabel: "Telemetry field",
    example: `{ "tokenCount": 100000 }`,
  },
  {
    slug: "ai-api-latency",
    ruleId: "mlops.high-api-latency",
    area: "AI workloads",
    title: "AI API latency",
    looksFor: "A supplied apiLatencyMs or routingLatencyMs of 500 or more.",
    needs: "Telemetry you include, in milliseconds.",
    finding: "Medium below 2,000 ms, and high at or above that. The suggested next step is to inspect routing, timeouts, model choice, and region.",
    limit: "It uses the number you supply. It does not measure the provider itself.",
    exampleLabel: "Telemetry field",
    example: `{ "apiLatencyMs": 500 }`,
  },
  {
    slug: "ai-compute-utilization",
    ruleId: "mlops.high-compute-utilization",
    area: "AI workloads",
    title: "AI compute utilization",
    looksFor: "A supplied computeUtilization, gpuUtilization, or cpuUtilization of 85 percent or more.",
    needs: "Telemetry you include, as a percent.",
    finding: "Medium below 95 percent, and high at or above that. The suggested next step is to review limits, batching, model size, and capacity.",
    limit: "For an AI workload review, cpuUtilization is read as compute utilization. It is not the scaling replica check.",
    exampleLabel: "Telemetry field",
    example: `{ "computeUtilization": 85 }`,
  },
  {
    slug: "autoscaling-capacity",
    ruleId: "scaling.autoscaling-ceiling",
    area: "Scaling and cost",
    title: "Autoscaling capacity",
    looksFor: "cpuUtilization of 80 percent or more while minReplicas is greater than or equal to maxReplicas.",
    needs: "All three numbers in the telemetry you include.",
    finding: "Medium below 95 percent CPU, and high at or above that, when the replica floor already meets the ceiling. The suggested next step is to review the maximum replica limit against demand.",
    limit: "High CPU alone is not this finding. The replica floor has to meet the ceiling as well. A missing number skips the check.",
    exampleLabel: "Telemetry fields",
    example: `{ "cpuUtilization": 80, "minReplicas": 4, "maxReplicas": 4 }`,
  },
  {
    slug: "database-bottlenecks",
    ruleId: "scaling.database-bottleneck",
    area: "Scaling and cost",
    title: "Database bottlenecks",
    looksFor: "dbQueryLatencyMs or databaseQueryLatencyMs of 500 or more, or a slowQueryCount or dbSlowQueries greater than zero.",
    needs: "Whichever of those telemetry fields you can supply.",
    finding: "Medium by default, and high when query latency is 2,000 ms or more. The suggested next step is to inspect plans, indexes, pools, and database capacity before adding application replicas.",
    limit: "It does not open the database or explain a query plan.",
    exampleLabel: "Telemetry fields",
    example: `{ "dbQueryLatencyMs": 500 }`,
  },
  {
    slug: "public-database",
    ruleId: "DB001",
    area: "Security",
    title: "Public database",
    looksFor: "A database that enables public network access in Terraform, CloudFormation, Kubernetes, Pulumi YAML, a Pulumi program, or Docker Compose.",
    needs: "The infrastructure text you paste or send from your editor. The check does not connect to the database.",
    finding: "High severity. The suggested next step is to disable public access and connect through a private network.",
    limit: "A public setting that is computed outside the submitted text is not evaluated. No finding does not prove the database is private.",
    exampleLabel: "Setting that this check is written to notice",
    example: `resource "aws_db_instance" "app" {
  publicly_accessible = true
}`,
  },
  {
    slug: "docker-socket",
    ruleId: "K8S003",
    area: "Security",
    title: "Docker socket",
    looksFor: "A workload that mounts the Docker socket or another host path, including a Compose volume for /var/run/docker.sock.",
    needs: "The manifest or Compose file text. The check does not inspect a running host.",
    finding: "High severity. The suggested next step is to use a scoped volume instead of the host socket.",
    limit: "A socket mounted only at runtime, outside the submitted text, is outside this check.",
    exampleLabel: "Volume that this check is written to notice",
    example: `volumes:
  - /var/run/docker.sock:/var/run/docker.sock`,
  },
  {
    slug: "missing-memory-limit",
    ruleId: "K8S008",
    area: "Reliability",
    title: "Missing memory limit",
    looksFor: "A container that does not set a memory limit, or a Compose memory limit of 0.",
    needs: "The workload text. The check does not measure live memory use.",
    finding: "Medium severity. The suggested next step is to set a memory limit so one workload cannot consume the host.",
    limit: "A limit applied by a cluster policy outside the submitted text is not visible to this check.",
    exampleLabel: "Compose setting that this check is written to notice",
    example: `mem_limit: 0`,
  },
  {
    slug: "disabled-timeout",
    ruleId: "APP012",
    area: "Reliability",
    title: "Disabled timeout",
    looksFor: "An application snippet that sets a timeout to 0, false, or none.",
    needs: "Source text you paste or send from your editor. This is a text pattern, not a runtime trace.",
    finding: "Medium severity. The suggested next step is to set a finite timeout so a stalled dependency cannot hold the process open.",
    limit: "A timeout configured only in a running process, and not in the submitted text, is outside this check.",
    exampleLabel: "Assignment that this check is written to notice",
    example: "timeout = 0",
  },
  {
    slug: "one-connection-pool",
    ruleId: "APP013",
    area: "Reliability",
    title: "One-connection pool",
    looksFor: "An application snippet that caps a connection pool at one.",
    needs: "Source text you paste or send from your editor. This is a text pattern, not a live pool measurement.",
    finding: "High severity. The suggested next step is to allow more than one connection so requests do not queue behind a single connection.",
    limit: "A pool size chosen by a library default, and not written in the submitted text, is outside this check.",
    exampleLabel: "Assignment that this check is written to notice",
    example: "pool_size = 1",
  },
  {
    slug: "container-runs-as-root",
    ruleId: "DF001",
    area: "Security",
    title: "Container runs as root",
    looksFor: "A Dockerfile whose last USER is root or 0, or a Dockerfile with no USER instruction.",
    needs: "The Dockerfile text. The check does not build or run the image.",
    finding: "High severity. The suggested next step is to end the image with a non-root USER the image already supports.",
    limit: "A root user that exists only in a comment is not a USER instruction. No finding does not prove the running container is unprivileged.",
    exampleLabel: "Instruction that this check is written to notice",
    example: "USER root",
  },
  {
    slug: "remote-script-piped-to-a-shell",
    ruleId: "DF003",
    area: "Security",
    title: "Remote script piped to a shell",
    looksFor: "A Dockerfile RUN instruction that downloads a script with curl or wget and pipes it to sh or bash.",
    needs: "The Dockerfile text. The check does not fetch the remote script.",
    finding: "High severity. The suggested next step is to download the script, review it, and pin a checksum before running it.",
    limit: "A download that is saved to a file and not piped to a shell is not this finding.",
    exampleLabel: "Instruction that this check is written to notice",
    example: "RUN curl -fsSL https://example.com/install.sh | bash",
  },
  {
    slug: "pull-request-target-checkout",
    ruleId: "GH001",
    area: "Security",
    title: "Pull request target checkout of PR code",
    looksFor: "A GitHub Actions workflow that triggers on pull_request_target and checks out the pull request head ref or head sha.",
    needs: "The workflow YAML. The check does not open the pull request.",
    finding: "Critical severity. The suggested next step is to avoid checking out pull request head code from pull_request_target.",
    limit: "A pull_request workflow, or a pull_request_target workflow that checks out only the base repository, is not this finding.",
    exampleLabel: "Checkout that this check is written to notice",
    example: `on:
  pull_request_target:
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}`,
  },
  {
    slug: "action-pinned-to-main",
    ruleId: "GH003",
    area: "Security",
    title: "Action pinned to @main",
    looksFor: "A GitHub Actions uses value pinned to @main or @master.",
    needs: "The workflow YAML. The check does not look up the action repository.",
    finding: "Medium severity. The suggested next step is to pin the action to a release tag or a full commit SHA.",
    limit: "The check does not invent a commit SHA when the workflow only names a branch.",
    exampleLabel: "Uses line that this check is written to notice",
    example: "- uses: actions/checkout@main",
  },
  {
    slug: "secret-file-copied-into-an-image",
    ruleId: "DF004",
    area: "Security",
    title: "Secret file copied into an image",
    looksFor: "A Dockerfile COPY or ADD whose source is .env, id_rsa, id_ed25519, a .pem file, or a path ending in credentials.",
    needs: "The Dockerfile text. The check does not read the copied file.",
    finding: "High severity. The suggested next step is to keep the secret file out of the image and mount it at runtime.",
    limit: "COPY package.json is not this finding. A copy instruction that appears only in a comment is not a finding.",
    exampleLabel: "Instruction that this check is written to notice",
    example: "COPY .env /app/.env",
  },
  {
    slug: "workflow-prints-a-secret",
    ruleId: "GH004",
    area: "Security",
    title: "Workflow prints a secret",
    looksFor: "A GitHub Actions run script that echoes or prints a \${{ secrets. }} expression.",
    needs: "The workflow YAML. The check does not run the workflow.",
    finding: "High severity. The suggested next step is to remove the secret from the script output.",
    limit: "A normal run: echo \"hello\" is not this finding. Mentioning secrets.GITHUB_TOKEN in an env mapping, without printing it, is not this finding.",
    exampleLabel: "Run script that this check is written to notice",
    example: "run: echo ${{ secrets.API_KEY }}",
  },
  {
    slug: "workflow-permissions-are-broad",
    ruleId: "GH002",
    area: "Security",
    title: "Workflow permissions are broad",
    looksFor: "A GitHub Actions workflow whose permissions value is write-all, or a pull_request_target workflow that sets contents: write.",
    needs: "The workflow YAML. The check does not change the workflow.",
    finding: "High severity. The suggested next step is to set the narrowest permissions the workflow needs and keep contents read-only on pull_request_target.",
    limit: "A multi-line permissions block is still this finding when it grants write-all or contents: write on pull_request_target. The safe edit only replaces an exact permissions: write-all line.",
    exampleLabel: "Permissions line that this check is written to notice",
    example: "permissions: write-all",
  },
  {
    slug: "secret-assigned-in-an-image-variable",
    ruleId: "DF005",
    area: "Security",
    title: "Secret assigned in an image variable",
    looksFor: "A Dockerfile ENV or ARG whose name is password, passwd, secret, api_key, apikey, auth_token, access_key, private_key, or token, with a non-empty literal value.",
    needs: "The Dockerfile text. The check does not build the image.",
    finding: "High severity. The suggested next step is to pass the value at runtime or from a secret mount.",
    limit: "ENV NODE_ENV=production, ENV PATH=/usr/bin, ARG VERSION=1, ENV TOKEN=$TOKEN, and ENV TOKEN=${TOKEN} are not this finding. A commented assignment is not a finding.",
    exampleLabel: "Instruction that this check is written to notice",
    example: "ENV API_KEY=abcd",
  },
  {
    slug: "secret-assigned-in-workflow-env",
    ruleId: "GH005",
    area: "Security",
    title: "Secret assigned in workflow env",
    looksFor: "A GitHub Actions env mapping whose key matches those secret-like names and whose value is a non-empty literal.",
    needs: "The workflow YAML. The check does not run the workflow.",
    finding: "High severity. The suggested next step is to use a secrets expression or github.token instead of a literal.",
    limit: "Values that are ${{ secrets.SOMETHING }}, ${{ github.token }}, or empty are not this finding. A run step that only echoes hello is not this finding. The workflow prints a secret check still applies when a script prints a secrets expression.",
    exampleLabel: "Env mapping that this check is written to notice",
    example: `env:
  TOKEN: literal-secret`,
  },
  {
    slug: "helm-privileged-container",
    ruleId: "HELM001",
    area: "Security",
    title: "Helm privileged container",
    looksFor: "A Helm template that sets privileged: true outside a comment.",
    needs: "The chart template text. Helm templates are not executed.",
    finding: "Critical severity. The suggested next step is to set privileged to false unless the workload is isolated on purpose.",
    limit: "A rendered Kubernetes manifest with no template markers is reviewed as Kubernetes, not Helm. A template that only sets replicas: 1 is not this finding. privileged: true in a comment is not a finding.",
    exampleLabel: "Setting that this check is written to notice",
    example: `securityContext:
  privileged: true`,
  },
  {
    slug: "ansible-task-runs-as-root",
    ruleId: "ANS001",
    area: "Security",
    title: "Ansible task runs as root",
    looksFor: "An Ansible play or task that sets become: true or become: yes outside a comment.",
    needs: "The playbook text. Ansible facts are not executed.",
    finding: "High severity. The suggested next step is to set become to false unless the task has a reviewed need to run as root.",
    limit: "A play with become: false and no public CIDR is not this finding. become: true in a comment is not a finding.",
    exampleLabel: "Task that this check is written to notice",
    example: `- hosts: all
  tasks:
    - name: install
      become: true`,
  },
  {
    slug: "storage-encryption-disabled",
    ruleId: "DATA002",
    area: "Security",
    title: "Storage encryption disabled",
    looksFor: "A database or volume that sets encryption to false, such as storage_encrypted = false or encrypted = false.",
    needs: "The infrastructure text you paste or send from your editor. The check does not open the cloud account.",
    finding: "High severity. The suggested next step is to turn encryption on and plan how existing data moves onto encrypted storage.",
    limit: "A resource that omits the encryption setting is not this finding. No finding does not prove the data is encrypted.",
    exampleLabel: "Setting that this check is written to notice",
    example: "storage_encrypted = false",
  },
  {
    slug: "database-backups-disabled",
    ruleId: "DB002",
    area: "Security",
    title: "Database backups disabled",
    looksFor: "A database whose backup retention period is set to zero.",
    needs: "The infrastructure text. The check does not open the database or a backup vault.",
    finding: "High severity. The suggested next step is to set a nonzero retention period and test a restore.",
    limit: "A database that omits the retention setting is not this finding. No finding does not prove backups exist.",
    exampleLabel: "Setting that this check is written to notice",
    example: "backup_retention_period = 0",
  },
  {
    slug: "possible-aws-access-key",
    ruleId: "SEC002",
    area: "Security",
    title: "Possible AWS access key",
    looksFor: "A value matching an AWS access key id: AKIA or ASIA, then 16 letters or digits.",
    needs: "The text you paste or send from your editor. The check does not call AWS.",
    finding: "Critical severity. The suggested next step is to remove the key from source, rotate it, and check repository history.",
    limit: "AKIA on its own, without 16 following characters, is not this finding. The check does not print the matched value.",
    exampleLabel: "Pattern that this check is written to notice",
    example: "AKIA then 16 letters or digits",
  },
  {
    slug: "private-key-material-in-source",
    ruleId: "SEC003",
    area: "Security",
    title: "Private key material in source",
    looksFor: "A private key block in the submitted text. The scanner matches an RSA, EC, OpenSSH, DSA, or generic private key header.",
    needs: "The text you paste or send. The check does not read a secret store.",
    finding: "Critical severity. The suggested next step is to revoke the key and load a replacement from a secret store.",
    limit: "A public certificate, and the words private key in a comment, are not this finding. The check does not return the key material.",
    exampleLabel: "Header that this check is written to notice",
    example: "An RSA, EC, OpenSSH, DSA, or generic private key header",
  },
  {
    slug: "pipeline-prints-a-secret",
    ruleId: "PIPE002",
    area: "Security",
    title: "Pipeline prints a secret",
    looksFor: "A GitLab CI, Azure Pipelines, or Cloud Build script line that echoes or prints a secret-like variable.",
    needs: "The pipeline text. The pipeline is not executed.",
    finding: "High severity. The suggested next step is to remove the printed secret from the script.",
    limit: "A script that only echoes hello is not this finding. A secret named only in a comment is not this finding.",
    exampleLabel: "Script line that this check is written to notice",
    example: "echo $CI_JOB_TOKEN",
  },
  {
    slug: "unpinned-pipeline-image",
    ruleId: "PIPE001",
    area: "Security",
    title: "Unpinned pipeline image",
    looksFor: "A GitLab CI, Azure Pipelines, or Cloud Build image or step name that uses latest, or that has no tag and no digest.",
    needs: "The pipeline text. The pipeline is not executed.",
    finding: "Medium severity. The suggested next step is to pin a release tag or an image digest.",
    limit: "A pinned tag such as node:20 is not this finding. An image named only in a comment is not this finding.",
    exampleLabel: "Image that this check is written to notice",
    example: "image: nginx:latest",
  },
  {
    slug: "secret-assigned-in-a-terraform-variable",
    ruleId: "TF001",
    area: "Security",
    title: "Secret assigned in a Terraform variable",
    looksFor: "A tfvars assignment or Terraform variable default that gives a non-empty literal to a secret-like name.",
    needs: "The tfvars file or the Terraform variable block. References are not evaluated.",
    finding: "High severity. The suggested next step is to pass the value from a secret store or leave the default empty.",
    limit: "A reference such as var.password, an empty string, and environment = \"prod\" are not this finding. A secret in a comment is not this finding.",
    exampleLabel: "Assignment that this check is written to notice",
    example: "password = \"hunter2\"",
  },
  {
    slug: "public-input-on-a-terraform-module",
    ruleId: "NET001",
    area: "Security",
    title: "Public input on a Terraform module",
    looksFor: "A Terraform module argument set to 0.0.0.0/0 or ::/0, unless the argument is egress, destination, or ipv6 egress, or a module argument publicly_accessible = true.",
    needs: "The module block in the submitted Terraform. The module body is not loaded and the module source is not fetched.",
    finding: "High severity. The suggested next step is to replace the public input with an approved range or turn public access off.",
    limit: "A module with cidr = \"10.0.0.0/24\" is not this finding. A public value that appears only in a comment is not this finding.",
    exampleLabel: "Module argument that this check is written to notice",
    example: `module "edge" {
  source = "./modules/edge"
  cidr = "0.0.0.0/0"
}`,
  },
  {
    slug: "secret-assigned-in-a-terraform-local",
    ruleId: "TF002",
    area: "Security",
    title: "Secret assigned in a Terraform local",
    looksFor: "A Terraform local whose name looks like a password, secret, or token, and whose value is a non-empty literal.",
    needs: "The locals block in the submitted Terraform. Interpolations are not evaluated.",
    finding: "High severity. The suggested next step is to pass the value from a secret store or a variable reference.",
    limit: "password = var.password, an empty string, and environment = \"prod\" are not this finding. A secret in a comment is not this finding.",
    exampleLabel: "Local that this check is written to notice",
    example: `locals {
  password = "hunter2"
}`,
  },
  {
    slug: "secret-assigned-in-serverless-environment",
    ruleId: "SLS001",
    area: "Security",
    title: "Secret assigned in serverless environment",
    looksFor: "A Serverless Framework provider or function environment entry whose name looks like a password, secret, or token, and whose value is a non-empty literal.",
    needs: "The Serverless Framework config. The config is not executed. An IpAddress of 0.0.0.0/0 is checked, and other condition operators are not.",
    finding: "High severity. The suggested next step is to reference the value with a Serverless variable such as ${env:TOKEN}.",
    limit: "${env:TOKEN} and ${self:custom.x} are not this finding. A value that appears only in a comment is not this finding.",
    exampleLabel: "Environment entry that this check is written to notice",
    example: `provider:
  environment:
    password: hunter2`,
  },
  {
    slug: "iam-policy-allows-every-action",
    ruleId: "IAM001",
    area: "Security",
    title: "IAM policy allows every action",
    looksFor: "A standalone IAM policy statement whose Effect is Allow, or omitted, and whose Action is * or a list containing only *.",
    needs: "The policy JSON. The policy is not executed. An IpAddress of 0.0.0.0/0 is checked, and other condition operators are not.",
    finding: "High severity. The suggested next step is to list the required actions instead of allowing every action.",
    limit: "An Effect of Deny is not this finding. A statement that lists s3:GetObject is not this finding.",
    exampleLabel: "Statement that this check is written to notice",
    example: `{
  "Version": "2012-10-17",
  "Statement": [{ "Effect": "Allow", "Action": "*", "Resource": "*" }]
}`,
  },
  {
    slug: "referenced-value-is-public",
    ruleId: "iac.referenced-public-value",
    area: "Security",
    title: "Referenced value is public",
    looksFor: "A same-file var, local, or CloudFormation parameter Default of 0.0.0.0/0 or ::/0 used through a reference.",
    needs: "The variable, local, or parameter Default and the resource or module argument that references it, in the same file.",
    finding: "High severity. The suggested next step is to replace the referenced public range with an approved range.",
    limit: "A private default such as 10.0.0.0/24 or 10.0.0.0/16 is not this finding. A parameter with no Default stays unresolved. A simple Fn::Sub or format of a known literal is a separate check. A value that appears only in a comment is not this finding.",
    exampleLabel: "Reference that this check is written to notice",
    example: `variable "cidr" {
  default = "0.0.0.0/0"
}
resource "aws_security_group" "web" {
  ingress {
    cidr_blocks = [var.cidr]
  }
}`,
  },
  {
    slug: "referenced-secret",
    ruleId: "iac.referenced-secret",
    area: "Security",
    title: "Referenced secret",
    looksFor: "A same-file secret-like variable or parameter default used through a reference.",
    needs: "The variable or parameter Default and the resource, module argument, or property that references it, in the same file.",
    finding: "High severity. The suggested next step is to pass the value from a secret store and leave the default empty.",
    limit: "An unknown name stays quiet. The same secret value is reported once. A secret that appears only in a comment is not this finding.",
    exampleLabel: "Reference that this check is written to notice",
    example: `variable "password" {
  default = "hunter2"
}
resource "aws_db_instance" "db" {
  password = var.password
}`,
  },
  {
    slug: "iam-condition-allows-every-address",
    ruleId: "iac.iam-open-source-address",
    area: "Security",
    title: "IAM condition allows every address",
    looksFor: "An IpAddress or aws:SourceIp value of 0.0.0.0/0, ::/0, or * on a standalone IAM policy or a Serverless iamRoleStatements entry.",
    needs: "The policy JSON or the Serverless iamRoleStatements entry. Other condition operators are not evaluated.",
    finding: "High severity. The suggested next step is to restrict the source address to an approved range.",
    limit: "A condition of 10.0.0.0/8 or a specific address is not this finding. An Effect of Deny is not this finding.",
    exampleLabel: "Condition that this check is written to notice",
    example: `Condition:
  IpAddress:
    aws:SourceIp: 0.0.0.0/0`,
  },
  {
    slug: "substituted-value-is-public",
    ruleId: "iac.substituted-public-value",
    area: "Security",
    title: "Substituted value is public",
    looksFor: "A same-file Fn::Sub or format result of 0.0.0.0/0 or ::/0.",
    needs: "The parameter Default or literal, and the Fn::Sub or format that uses it, in the same file.",
    finding: "High severity. The suggested next step is to replace the substituted public range with an approved range.",
    limit: "Fn::Sub of a parameter with no Default, Fn::Sub of AWS::Region, and format of 10.0.0.0/24 are not this finding. Fn::Join and other functions stay unresolved. A value that appears only in a comment is not this finding.",
    exampleLabel: "Substitution that this check is written to notice",
    example: `Parameters:
  Cidr:
    Type: String
    Default: 0.0.0.0/0
Resources:
  Sg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      SecurityGroupIngress:
        - CidrIp:
            Fn::Sub: "\${Cidr}"`,
  },
  {
    slug: "policy-allows-any-principal",
    ruleId: "iac.policy-any-principal",
    area: "Security",
    title: "Policy allows any principal",
    looksFor: "Principal * on an Allow statement inside a resource policy.",
    needs: "The policy or PolicyDocument inside the resource. A standalone IAM file is checked separately. The policy is not executed.",
    finding: "High severity. The suggested next step is to name the trusted principals explicitly.",
    limit: "An Effect of Deny is not this finding. A principal that is a specific ARN is not this finding. A comment that mentions Principal * is not this finding.",
    exampleLabel: "Statement that this check is written to notice",
    example: `{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "sts:AssumeRole"
}`,
  },
];

export const publicCheckAreas = ["Security", "Reliability", "AI workloads", "Scaling and cost"] as const;

export function publicCheckBySlug(slug: string): PublicCheck | undefined {
  return publicChecks.find((check) => check.slug === slug);
}

export function publicCheckPath(check: Pick<PublicCheck, "slug">): string {
  return `/checks/${check.slug}`;
}
