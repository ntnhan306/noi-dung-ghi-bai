export enum NodeType {
  ROOT = 'ROOT',
  SUBJECT = 'SUBJECT',      // Môn
  SUB_SUBJECT = 'SUB_SUBJECT', // Phân môn
  PART = 'PART',            // Phần
  CHAPTER = 'CHAPTER',      // Chương
  LESSON = 'LESSON'         // Bài
}

export interface NodeData {
  id: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  content?: string; // Only for LESSON
  createdAt: number;
}

export interface Breadcrumb {
  id: string;
  title: string;
}

export const NODE_LABELS: Record<NodeType, string> = {
  [NodeType.ROOT]: 'Trang chủ',
  [NodeType.SUBJECT]: 'Môn học',
  [NodeType.SUB_SUBJECT]: 'Phân môn',
  [NodeType.PART]: 'Phần',
  [NodeType.CHAPTER]: 'Chương',
  [NodeType.LESSON]: 'Bài học',
};

export const ALLOWED_CHILDREN: Record<NodeType, NodeType[]> = {
  [NodeType.ROOT]: [NodeType.SUBJECT],
  [NodeType.SUBJECT]: [NodeType.SUB_SUBJECT, NodeType.PART, NodeType.CHAPTER],
  [NodeType.SUB_SUBJECT]: [NodeType.PART, NodeType.CHAPTER],
  [NodeType.PART]: [NodeType.CHAPTER],
  [NodeType.CHAPTER]: [NodeType.LESSON],
  [NodeType.LESSON]: [], // Lessons are leaf nodes
};