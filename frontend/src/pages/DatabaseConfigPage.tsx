import React, { useState, useEffect } from "react";
import {
  Database,
  Settings,
  Play,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Activity,
  Server,
  Brain,
  Shield,
  Eye,
  Search, // Added missing import
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

// --- MOCK UI COMPONENTS (Replace these with your actual @/components/ui imports) ---
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);
const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-3">{children}</div>
);
const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <h3 className={`font-semibold text-lg ${className}`}>{children}</h3>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
  />
);
const Button = ({
  children,
  className = "",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "lg";
}) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
      size === "lg" ? "h-11 px-8" : "h-10 px-4 py-2"
    } ${className}`}
  >
    {children}
  </button>
);

// --- MOCK API SERVICE (Replace with your actual import) ---
// import { useApiClient } from '@/services/ApiService';
const useApiClient = () => ({
  client: {
    initializeSystem: async () => ({ success: true }),
    saveConfig: async (config: any) => ({ success: true }),
    validateSystem: async () => ({
      database_connection: true,
      azure_config_connection: true,
      schema_loaded: true,
      knowledge_base_ready: true,
      vector_index_ready: true,
      agent_ready: true,
      overall_ready: true,
      errors: [],
      warnings: [],
    }),
  },
});

type StatusType = "success" | "error" | "warning" | "loading" | "info";

interface SystemValidation {
  database_connection: boolean;
  azure_config_connection: boolean;
  schema_loaded: boolean;
  knowledge_base_ready: boolean;
  vector_index_ready: boolean;
  agent_ready: boolean;
  overall_ready: boolean;
  errors: string[];
  warnings: string[];
}

const StatusBadge = ({
  status,
  label,
  size = "default",
}: {
  status: StatusType;
  label: string;
  size?: "default" | "sm";
}) => {
  const statusColors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    loading: "bg-blue-50 text-[#35168b] border-blue-200",
    info: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    loading: Loader2,
    info: Activity,
  };

  const Icon = icons[status] || Activity;
  const sizeClasses =
    size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div
      className={`inline-flex items-center gap-2 ${sizeClasses} rounded-lg border font-medium ${statusColors[status]}`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`}
      />
      {label}
    </div>
  );
};

const EnhancedDatabaseConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    database_type: "",
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
    azure_endpoint: "",
    azure_api_key: "",
    azure_deployment: "",
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [validationResult, setValidationResult] =
    useState<SystemValidation | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationPhase, setValidationPhase] = useState<string>("");
  const { client } = useApiClient();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
     
        const data = {
          success: true,
          config: { database: {}, azure_config: {} },
        };

        if (data.success) {
          const cfg = data.config;
          setConfig({
            database_type: cfg.database?.type || "",
            host: cfg.database?.host || "",
            port: cfg.database?.port?.toString() || "",
            username: cfg.database?.username || "",
            password: cfg.database?.password || "",
            database: cfg.database?.database || "",
            azure_endpoint: cfg.azure_config?.api_base || "",
            azure_api_key: cfg.azure_config?.api_key || "",
            azure_deployment: cfg.azure_config?.deployment_name || "gpt-4o",
          });
        }
      } catch (err) {
        console.error("Error fetching config:", err);
      }
    };

    fetchConfig();
  }, []);

  const handleInitializeSystem = async () => {
    try {
      setIsConnecting(true);
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await client.initializeSystem();
      if (result.success) {
        alert("System initialized successfully.");
      } else {
        alert("Failed to initialize the system.");
      }
    } catch (error) {
      console.error("Initialize system Error:", error);
      alert("Error initializing system configuration.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const fullConfig = {
        database: {
          type: config.database_type,
          host: config.host,
          port: Number(config.port),
          database: config.database,
          username: config.username,
          password: config.password,
        },
        azure_config: {
          api_key: config.azure_api_key,
          api_base: config.azure_endpoint,
          api_version: "2023-05-15",
          deployment_name: config.azure_deployment,
          embedding_deployment: "text-embedding-ada-002",
        },
        knowledge_base: {
          path: "knowledge_base",
          business_context_file: "business_context.txt",
        },
        advanced_settings: {
          max_context_length: 4000,
          chunk_size: 1000,
          chunk_overlap: 200,
          max_query_retries: 3,
          query_timeout: 60,
          vector_search_k: 5,
        },
      };

      const result = await client.saveConfig(fullConfig);
      if (result.success) {
        setIsConnecting(true);
        setValidationResult(null);
        setCurrentStep(3);
        // Small delay to simulate transition
        setTimeout(() => setIsConnecting(false), 500);
        alert("Configuration saved successfully.");
      } else {
        alert("Failed to save config.");
      }
    } catch (error) {
      console.error("Save Config Error:", error);
      alert("Error saving configuration.");
    }
  };

  const handleValidateConfig = async () => {
    try {
      setIsConnecting(true);
      setValidationResult(null);
      setCurrentStep(4);
      setValidationPhase("Validating system configuration...");

      // Simulate steps for visual effect since we have a phase state
      const steps = [
        "Checking DB...",
        "Checking API...",
        "Verifying Schema...",
      ];
      for (const step of steps) {
        setValidationPhase(step);
        await new Promise((r) => setTimeout(r, 800));
      }

      const result = await client.validateSystem();
      setValidationResult(result);
      setValidationPhase(
        result.overall_ready
          ? "System ready for use!"
          : "System validation failed"
      );
    } catch (error) {
      console.error("Validation Error:", error);
      alert("Error validating configuration.");
    } finally {
      setIsConnecting(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Database Connection",
      icon: Database,
      description: "Configure your database connection parameters",
    },
    {
      id: 2,
      title: "API Setup",
      icon: Zap,
      description: "Set up your API service configuration",
    },
    {
      id: 3,
      title: "Validation & Test",
      icon: CheckCircle,
      description: "Validate all connections and test system integration",
    },
  ];

  const getValidationStatus = (key: keyof SystemValidation): StatusType => {
    if (isConnecting) return "loading";
    if (!validationResult) return "info";
    return (validationResult[key] as boolean) ? "success" : "error";
  };

  return (
    <>
      {<Header />}

      <div className="min-h-screen bg-gradient-to-br from-[#f3effc] via-white to-[#ebe6fb] p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-red-500/70 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-900 to-red-500/70 bg-clip-text text-transparent p-1">
                NLP Data Search Engine
              </h1>
            </div>
            <p className="text-slate-600 text-lg">
              Enterprise Database Configuration
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? "  bg-blue-100 text-blue shadow-sm"
                          : isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs opacity-75">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Database Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#35168b]" />
                    Database Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Host
                      </label>
                      <Input
                        type="text"
                        value={config.host}
                        onChange={(e) =>
                          setConfig({ ...config, host: e.target.value })
                        }
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Port
                      </label>
                      <Input
                        type="text"
                        value={config.port}
                        onChange={(e) =>
                          setConfig({ ...config, port: e.target.value })
                        }
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Username
                      </label>
                      <Input
                        type="text"
                        value={config.username}
                        onChange={(e) =>
                          setConfig({ ...config, username: e.target.value })
                        }
                        placeholder="your_username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password
                      </label>
                      <Input
                        type="password"
                        value={config.password}
                        onChange={(e) =>
                          setConfig({ ...config, password: e.target.value })
                        }
                        placeholder="your_password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Database Name
                      </label>
                      <Input
                        type="text"
                        value={config.database}
                        onChange={(e) =>
                          setConfig({ ...config, database: e.target.value })
                        }
                        placeholder="your_database"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Database Type
                      </label>
                      <select
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-slate-500"
                        value={config.database_type}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            database_type: e.target.value,
                          })
                        }
                      >
                        <option value="">Select DB</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="sqlserver">SQL Server</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Azure OpenAI Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        API Endpoint
                      </label>
                      <Input
                        type="url"
                        value={config.azure_endpoint}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            azure_endpoint: e.target.value,
                          })
                        }
                        placeholder="https://api-url.com/"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        API Key
                      </label>
                      <Input
                        type="password"
                        value={config.azure_api_key}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            azure_api_key: e.target.value,
                          })
                        }
                        placeholder="Your API key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Model Deployment
                      </label>
                      <select
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                        value={config.azure_deployment}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            azure_deployment: e.target.value,
                          })
                        }
                      >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Initialize Button */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleSaveConfig}
                  className="bg-gradient-to-br from-blue-900 to-red-500/70 hover:bg-[#3d1f8f] text-white px-8 py-3 text-lg shadow-lg"
                  size="lg"
                >
                  Save Config
                </Button>
                <Button
                  onClick={handleInitializeSystem}
                  disabled={isConnecting}
                  className="bg-gradient-to-br from-blue-900 to-red-500/70 hover:bg-[#3d1f8f] text-white px-8 py-3 text-lg shadow-lg"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Initializing System...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Initialize System
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleValidateConfig}
                  className="bg-gradient-to-br from-blue-900 to-red-500/70 hover:bg-[#3d1f8f] text-white px-8 py-3 text-lg shadow-lg"
                  size="lg"
                >
                  Validate
                </Button>
              </div>
            </div>

            {/* Status Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isConnecting && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#35168b]" />
                        <span className="text-sm font-medium text-blue-800">
                          Validating
                        </span>
                      </div>
                      <p className="text-xs text-[#35168b]">
                        {validationPhase}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#35168b]" />
                        Database Connection
                      </span>
                      <StatusBadge
                        status={getValidationStatus("database_connection")}
                        label={
                          validationResult?.database_connection
                            ? "Connected"
                            : "Disconnected"
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        API Config
                      </span>
                      <StatusBadge
                        status={getValidationStatus("azure_config_connection")}
                        label={
                          validationResult?.azure_config_connection
                            ? "Online"
                            : "Offline"
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Server className="w-4 h-4 text-green-600" />
                        Schema Loaded
                      </span>
                      <StatusBadge
                        status={getValidationStatus("schema_loaded")}
                        label={
                          validationResult?.schema_loaded
                            ? "Ready"
                            : "Not Loaded"
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600" />
                        Knowledge Base
                      </span>
                      <StatusBadge
                        status={getValidationStatus("knowledge_base_ready")}
                        label={
                          validationResult?.knowledge_base_ready
                            ? "Ready"
                            : "Not Ready"
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4 text-indigo-600" />
                        SQL Agent
                      </span>
                      <StatusBadge
                        status={getValidationStatus("agent_ready")}
                        label={
                          validationResult?.agent_ready ? "Active" : "Inactive"
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  {validationResult && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          Overall Status
                        </span>
                        <StatusBadge
                          status={
                            validationResult.overall_ready ? "success" : "error"
                          }
                          label={
                            validationResult.overall_ready
                              ? "System Ready"
                              : "Issues Found"
                          }
                        />
                      </div>
                    </div>
                  )}

                  {(validationResult?.errors?.length ?? 0) > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Errors:
                      </p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {(validationResult?.errors ?? []).map(
                          (error, index) => (
                            <li key={index}>• {error}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {(validationResult?.warnings?.length ?? 0) > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Warnings:
                      </p>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {(validationResult?.warnings ?? []).map(
                          (warning, index) => (
                            <li key={index}>• {warning}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {validationResult?.overall_ready && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-green-800 mb-2">
                        System Ready!
                      </h3>
                      <p className="text-sm text-green-700 mb-4">
                        All components validated successfully. You can now
                        proceed to explore your schema and start querying.
                      </p>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => (window.location.href = "/ai/schema")}
                      >
                        Continue to Schema Explorer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedDatabaseConfigPage;
