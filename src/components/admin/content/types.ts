export type ContentType = 'course' | 'product';

export type ContentStatus = 'draft' | 'pending' | 'approved' | 'active' | 'rejected';

export interface CourseInstructorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  instructor_profiles?: {
    headline?: string | null;
    total_students?: number | null;
    avg_rating?: number | null;
    total_courses?: number | null;
  } | null;
}

export interface CourseInstructorJoin {
  instructor_id?: string;
  is_primary?: boolean | null;
  revenue_share?: number | null;
  profiles?: CourseInstructorProfile | null;
}

export interface CourseLecture {
  id: string;
  title: string;
  title_ta?: string | null;
  type: string | null;
  video_duration_secs: number | null;
  read_time_mins?: number | null;
  quiz_duration_mins?: number | null;
  video_url?: string | null;
  article_content?: string | null;
  quiz?: {
    id: string;
    title?: string | null;
    title_ta?: string | null;
    pass_percentage?: number | null;
    time_limit_mins?: number | null;
    is_published?: boolean | null;
    question_count?: number;
  } | null;
  is_published: boolean | null;
  is_free_preview: boolean | null;
  sort_order: number | null;
}

export interface InstructorOption {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  headline?: string | null;
}

export interface CourseSection {
  id: string;
  title: string;
  sort_order: number | null;
  lectures?: CourseLecture[] | null;
}

export interface CourseItem {
  id: string;
  title: string;
  title_ta?: string | null;
  slug?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  status: ContentStatus | string;
  language?: string | null;
  difficulty?: string | null;
  price?: number | null;
  discounted_price?: number | null;
  is_free?: boolean | null;
  total_enrolled?: number | null;
  total_lectures?: number | null;
  total_duration_mins?: number | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  certificate_enabled?: boolean | null;
  created_at?: string | null;
  published_at?: string | null;
  rejection_reason?: string | null;
  tags?: string[] | null;
  learning_outcomes?: string[] | null;
  requirements?: string[] | null;
  categories?: { name?: string | null; slug?: string | null } | null;
  course_instructors?: CourseInstructorJoin[] | null;
  course_sections?: CourseSection[] | null;
}

export interface SellerProfileJoin {
  user_id: string;
  store_name?: string | null;
  store_slug?: string | null;
  avg_rating?: number | null;
  total_sales?: number | null;
  commission_rate?: number | null;
  profiles?: {
    id?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface ProductItem {
  id: string;
  name: string;
  name_ta?: string | null;
  slug?: string | null;
  description?: string | null;
  images?: string[] | null;
  price?: number | null;
  discounted_price?: number | null;
  status: ContentStatus | string;
  stock_qty?: number | null;
  low_stock_threshold?: number | null;
  total_sold?: number | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  created_at?: string | null;
  published_at?: string | null;
  rejection_reason?: string | null;
  tags?: string[] | null;
  sku?: string | null;
  weight?: string | number | null;
  related_course_tags?: string[] | null;
  product_categories?: { id?: string; name?: string | null; slug?: string | null; icon?: string | null } | null;
  seller_profiles?: SellerProfileJoin | null;
}

export interface CoursesStats {
  totalCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  rejectedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
}

export interface ProductsStats {
  totalProducts: number;
  pendingProducts: number;
  activeProducts: number;
  rejectedProducts: number;
  draftProducts: number;
  totalUnitsSold: number;
}
