import { Trash2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  title: string;
  created_at: string;
  onDelete: (id: string) => void;
}

export default function NotebookCard({ id, title, created_at, onDelete }: Props) {
  const router = useRouter();

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/notebook/${id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}