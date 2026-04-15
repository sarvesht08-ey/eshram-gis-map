import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Table,
  Edit,
  Save,
  X,
  Download,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Database,
  Loader2,
  BarChart3,
  Info,
} from "lucide-react";
import { useApiClient, SchemaUtils } from "@/services/ApiService";
import type { SchemaResponse } from "@/services/ApiService";
import Header from "./Header";

const SchemaExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const { client, loading, error, executeWithLoading } = useApiClient();

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const rawSchemaData = await executeWithLoading(() =>
          client.getSchema()
        );
        console.log("Raw schema response:", rawSchemaData);

        // Check if it's an object and not null
        if (
          rawSchemaData &&
          typeof rawSchemaData === "object" &&
          !Array.isArray(rawSchemaData)
        ) {
          // Get tables from values
          const tables = Object.values(rawSchemaData).filter(
            (tbl: any) => tbl && Array.isArray(tbl.columns)
          );

          if (tables.length > 0) {
            setSchema({
              tables,
              total_tables: tables.length,
              total_columns: tables.reduce(
                (acc, tbl) => acc + (tbl.columns?.length || 0),
                0
              ),
              database_type: "unknown",
            });
            setSelectedTable(tables[0]);
            return;
          }
        }

        // If invalid structure
        console.error("Invalid schema structure:", rawSchemaData);
        setSchema({
          tables: [],
          total_tables: 0,
          total_columns: 0,
          database_type: "unknown",
        });
      } catch (error) {
        console.error("Schema loading error:", error);
      }
    };

    loadSchema();
  }, []);

  const handleSchemaUpdate = (updatedSchema: SchemaResponse) => {
    setSchema(updatedSchema);
  };

  const handleEditColumn = (
    tableName: string,
    columnName: string,
    currentDescription: string
  ) => {
    setSelectedTable(schema?.tables.find((t) => t.name === tableName));
    setEditingColumn(columnName);
    setNewDescription(currentDescription || "");
    setSaveStatus("idle");
  };

  const handleSaveDescription = async () => {
    if (!selectedTable || !editingColumn) return;
    setSaveStatus("saving");

    try {
      const success = await SchemaUtils.saveDescriptionChange(
        client,
        selectedTable.name,
        editingColumn,
        newDescription
      );

      if (success) {
        setSaveStatus("success");
        if (schema) {
          const updatedSchema = { ...schema };
          const table = updatedSchema.tables.find(
            (t) => t.name === selectedTable.name
          );
          if (table) {
            const column = table.columns.find((c) => c.name === editingColumn);
            if (column) {
              column.description = newDescription;
            }
          }
          handleSchemaUpdate(updatedSchema);
        }
        setTimeout(() => {
          setEditingColumn(null);
          setNewDescription("");
          setSaveStatus("idle");
        }, 1000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving description:", error);
      setSaveStatus("error");
    }
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
    setNewDescription("");
    setSaveStatus("idle");
  };

  const handleExportSchema = async () => {
    try {
      const exportData = await SchemaUtils.exportSchema(client, "json");
      const blob = new Blob([JSON.stringify(exportData.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schema-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export schema:", error);
    }
  };

  // Use SchemaUtils for filtering
  const filteredTables = schema
    ? SchemaUtils.filterTables(schema.tables, searchTerm)
    : [];

  // Calculate schema statistics using SchemaUtils
  const schemaStats = schema ? SchemaUtils.calculateSchemaStats(schema) : null;

  if (loading && !schema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading schema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">Error loading schema: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Schema Explorer
              </h1>
              <p className="text-gray-600">
                Explore and manage your database schema.
              </p>
              {schemaStats && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{schemaStats.totalTables} tables</span>
                  <span>•</span>
                  <span>{schemaStats.totalColumns} columns</span>
                  <span>•</span>
                  <span>
                    {SchemaUtils.formatRowCount(schemaStats.totalRows)} total
                    rows
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportSchema} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                onClick={() => navigate("/chat")}
                className="bg-gradient-to-br from-blue-900 to-red-500/70 text-white"
              >
                <MessageSquare className="w-5 h-5 mr-2" /> Go to Chat
              </Button>
            </div>
          </div>

          {/* Schema Statistics */}
          {schemaStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {schemaStats.totalTables}
                      </div>
                      <div className="text-sm text-gray-600">Tables</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {schemaStats.totalColumns}
                      </div>
                      <div className="text-sm text-gray-600">Columns</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Table className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {SchemaUtils.formatRowCount(schemaStats.totalRows)}
                      </div>
                      <div className="text-sm text-gray-600">Total Rows</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {schemaStats.descriptionCoverage.tables.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Documented</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Tables ({filteredTables.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tables..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[600px]">
                <div className="space-y-1 p-4">
                  {filteredTables.map((table: any) => (
                    <div
                      key={table.name}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedTable?.name === table.name
                          ? "bg-primary/10 border-primary/20 shadow-sm"
                          : "hover:bg-muted/50 border-transparent"
                      }`}
                      onClick={() => setSelectedTable(table)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {table.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {table.schema_name}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {SchemaUtils.formatRowCount(table.row_count || 0)} rows
                        • {table.columns?.length} columns
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {table.business_description ||
                          "No description provided."}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Table Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {selectedTable
                      ? `Table: ${selectedTable.name}`
                      : "Select a table"}
                  </span>
                  {selectedTable && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {SchemaUtils.formatRowCount(
                          selectedTable.row_count || 0
                        )}{" "}
                        rows
                      </Badge>
                      <Badge variant="secondary">
                        {selectedTable.columns?.length} columns
                      </Badge>
                    </div>
                  )}
                </CardTitle>
                {selectedTable && (
                  <CardDescription className="text-sm">
                    {selectedTable.business_description ||
                      "No description provided."}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="overflow-auto max-h-[600px]">
                {selectedTable ? (
                  <div className="space-y-4">
                    {/* Table Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Primary Keys
                        </div>
                        <div className="text-lg font-bold">
                          {
                            selectedTable.columns.filter(
                              (col: any) => col.primary_key
                            ).length
                          }
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Nullable
                        </div>
                        <div className="text-lg font-bold">
                          {
                            selectedTable.columns.filter(
                              (col: any) => col.nullable
                            ).length
                          }
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Data Types
                        </div>
                        <div className="text-lg font-bold">
                          {
                            new Set(
                              selectedTable.columns.map(
                                (col: any) => col.data_type
                              )
                            ).size
                          }
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Avg Null %
                        </div>
                        <div className="text-lg font-bold">
                          {selectedTable.columns.length > 0
                            ? (
                                selectedTable.columns.reduce(
                                  (sum: number, col: any) =>
                                    sum + (col.null_percentage || 0),
                                  0
                                ) / selectedTable.columns.length
                              ).toFixed(1)
                            : "0"}
                          %
                        </div>
                      </div>
                    </div>

                    {/* Column Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">
                        COLUMN DETAILS
                      </h4>
                      {selectedTable.columns.map((column: any) => {
                        const semanticTypeInfo =
                          SchemaUtils.getSemanticTypeInfo(column.semantic_type);

                        return (
                          <div
                            key={column.name}
                            className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {SchemaUtils.getDataTypeIcon(
                                    column.data_type
                                  )}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">
                                      {column.name}
                                    </span>
                                    {column.primary_key && (
                                      <Badge
                                        variant="default"
                                        className="text-xs px-1.5 py-0.5"
                                      >
                                        PK
                                      </Badge>
                                    )}
                                    {column.foreign_key && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-1.5 py-0.5"
                                      >
                                        FK
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {column.data_type}
                                    </Badge>
                                    <Badge
                                      className={`text-xs ${semanticTypeInfo.color}`}
                                    >
                                      {semanticTypeInfo.display}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {(column.null_percentage || 0).toFixed(1)}%
                                  null
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {column.unique_count?.toLocaleString() ||
                                    "N/A"}{" "}
                                  unique
                                </div>
                              </div>
                            </div>

                            {editingColumn === column.name ? (
                              <div className="mt-2">
                                <div className="flex gap-2 mb-2">
                                  <Input
                                    value={newDescription}
                                    onChange={(e) =>
                                      setNewDescription(e.target.value)
                                    }
                                    placeholder="Enter column description..."
                                    className="flex-1"
                                    disabled={saveStatus === "saving"}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleSaveDescription}
                                    disabled={saveStatus === "saving"}
                                  >
                                    {saveStatus === "saving" ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                {saveStatus === "error" && (
                                  <p className="text-xs text-red-600">
                                    Failed to save description
                                  </p>
                                )}
                                {saveStatus === "success" && (
                                  <p className="text-xs text-green-600">
                                    Description saved successfully
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {column.description ||
                                      "No description provided."}
                                  </p>
                                  {column.sample_values &&
                                    column.sample_values.length > 0 && (
                                      <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                                        <span className="font-medium text-muted-foreground">
                                          Sample values:{" "}
                                        </span>
                                        <span className="font-mono">
                                          {column.sample_values
                                            .slice(0, 4)
                                            .join(", ")}
                                          {column.sample_values.length > 4 &&
                                            "..."}
                                        </span>
                                      </div>
                                    )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleEditColumn(
                                      selectedTable.name,
                                      column.name,
                                      column.description || ""
                                    )
                                  }
                                  className="ml-2"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        Select a table to view details
                      </p>
                      <p className="text-sm">
                        Choose a table from the left panel to explore its schema
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default SchemaExplorerPage;
