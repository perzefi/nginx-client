import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

// Get stack-specific configuration
const config = new pulumi.Config();
const appName = config.get("appName") || "nginx";
const namespace = config.get("namespace") || "pulumi";
const replicas = config.getNumber("replicas") || 2;
const nginxVersion = config.get("nginxVersion") || "latest";
const cpuRequest = config.get("cpuRequest") || "100m";
const memoryRequest = config.get("memoryRequest") || "128Mi";
const cpuLimit = config.get("cpuLimit") || "200m";
const memoryLimit = config.get("memoryLimit") || "256Mi";
const serviceType = config.get("serviceType") || "ClusterIP";
const port = config.getNumber("port") || 80;

// Export the current stack name for clarity
export const stackName = pulumi.getStack();

// Create an NGINX Deployment
const appLabels = { app: appName };
const deployment = new k8s.apps.v1.Deployment(`${appName}-deployment`, {
    metadata: {
        name: `${appName}-${stackName}`,
        namespace: namespace,
        labels: appLabels,
    },
    spec: {
        replicas: replicas,
        selector: { matchLabels: appLabels },
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: appName,
                    image: `nginx:${nginxVersion}`,
                    ports: [{ containerPort: 80 }],
                    resources: {
                        requests: {
                            cpu: cpuRequest,
                            memory: memoryRequest,
                        },
                        limits: {
                            cpu: cpuLimit,
                            memory: memoryLimit,
                        },
                    },
                    livenessProbe: {
                        httpGet: {
                            path: "/",
                            port: 80,
                        },
                        initialDelaySeconds: 30,
                        timeoutSeconds: 5,
                    },
                    readinessProbe: {
                        httpGet: {
                            path: "/",
                            port: 80,
                        },
                        initialDelaySeconds: 5,
                        timeoutSeconds: 3,
                    },
                }],
            },
        },
    },
});

// Create a Service to expose the NGINX Deployment
const service = new k8s.core.v1.Service(`${appName}-service`, {
    metadata: {
        name: `${appName}-${stackName}`,
        namespace: namespace,
        labels: appLabels,
    },
    spec: {
        type: serviceType,
        ports: [{ port: port, targetPort: 80 }],
        selector: appLabels,
    },
});
