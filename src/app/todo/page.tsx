import { ToolFrame } from "@/components/tool-frame";
import { TodoList } from "@/features/todo/todo-list";

export const metadata = { title: "TodoList" };

export default function TodoPage() {
  return (
    <ToolFrame slug="todo">
      <TodoList />
    </ToolFrame>
  );
}
