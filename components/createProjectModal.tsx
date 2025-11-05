import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
} from "lucide-react";

const DB_TYPES = [
  { value: "postgres", label: "PostgreSQL", icon: "🐘" },
  { value: "mysql", label: "MySQL", icon: "🐬" },
  { value: "mongodb", label: "MongoDB", icon: "🍃" },
];

type CreateProjectModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
};

const CreateProjectModal = ({ isModalOpen, setIsModalOpen }: CreateProjectModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    project?: any;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dbType: "postgres",
    dbUrl: "",
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post("/api/projects", formData);

      setResult({
        success: true,
        message: "Project created successfully!",
        project: data.project,
      });

      setTimeout(() => {
        setFormData({
          name: "",
          description: "",
          dbType: "postgres",
          dbUrl: "",
        });
        setResult(null);
        setIsModalOpen(false);
      }, 2000);
    } catch (error: any) {
      setResult({
        success: false,
        message:
          error.response?.data?.error ||
          "Failed to create project. Please try again.",
        details: error.response?.data?.details,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Connect your database and start querying with AI
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="My Awesome Project"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional: Describe your project..."
            />
          </div>

          {/* Database Type */}
          <div className="space-y-2">
            <Label>
              Database Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {DB_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={
                    formData.dbType === type.value ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormData({ ...formData, dbType: type.value })
                  }
                  className="h-auto py-4 flex flex-col"
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Database URL */}
          <div className="space-y-2">
            <Label htmlFor="dbUrl">
              Database Connection URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dbUrl"
              name="dbUrl"
              value={formData.dbUrl}
              onChange={handleChange}
              required
              placeholder={
                formData.dbType === "mongodb"
                  ? "mongodb://username:password@host:27017/dbname"
                  : formData.dbType === "mysql"
                  ? "mysql://username:password@host:3306/dbname"
                  : "postgresql://username:password@host:5432/dbname"
              }
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              🔒 Your database URL will be encrypted and stored securely
            </p>
          </div>

          {/* Result Messages */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription className="font-medium">
                    {result.message}
                  </AlertDescription>
                  {result.details && (
                    <AlertDescription className="text-sm mt-1">
                      {result.details}
                    </AlertDescription>
                  )}
                  {result.success && result.project && (
                    <AlertDescription className="text-sm mt-2">
                      Tables found: {result.project.tablesCount}
                    </AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Database...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h3 className="font-medium text-sm mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• We'll securely connect to your database</li>
            <li>• Analyze your database schema and structure</li>
            <li>• Generate a summary for AI-powered queries</li>
            <li>• All data is encrypted and secure</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
