export type Platform =
  | "Instagram" | "TikTok" | "LinkedIn Personal" | "LinkedIn WVW"
  | "Threads" | "Facebook" | "Bluesky" | "Newsletter" | "Podcast";

export type ContentType =
  | "Reel" | "Carousel" | "Static Image" | "Story" | "Short Video"
  | "Long Video" | "Article" | "Newsletter" | "Podcast Episode" | "Thread" | "Quote";

export type TopicCategory =
  | "Black Mental Health" | "Burnout Prevention" | "Psychological Safety"
  | "Luxury Self-Care" | "WVW Academy" | "Founder Reflection"
  | "Workplace Culture" | "Employee Experience" | "Leadership Development"
  | "Neurodivergence" | "Systems Change";

export type HookType =
  | "Question" | "Statement" | "Story" | "Statistic"
  | "Controversy" | "Personal Confession" | "Pattern Interrupt";

export type PostStatus =
  | "Idea" | "Drafting" | "Designed" | "Scheduled" | "Posted" | "Repurpose" | "Archived";

export type BehaviorTag =
  | "Lurker" | "Engager" | "Sharer" | "Lead"
  | "Returning Community Member" | "Potential Client" | "Collaborator";

export type InteractionType =
  | "Comment" | "DM" | "Inquiry" | "Collaboration"
  | "Testimonial" | "Referral" | "Newsletter Reply" | "Podcast Listener Message";

export type FollowUpStatus =
  | "New" | "Needs Response" | "Responded" | "Warm Lead" | "Booked Call" | "Closed" | "Not a Fit";

export type ConversionType =
  | "Consultation Inquiry" | "Newsletter Signup" | "Training Interest"
  | "WVW Academy Waitlist" | "Podcast Inquiry" | "Partnership Inquiry"
  | "Speaking Opportunity" | "Client Lead";

export type ConversionStatus = "New" | "In Progress" | "Converted" | "Lost" | "Nurture";

export type TestType =
  | "Hook Test" | "Posting Time Test" | "Format Test" | "Caption Length Test"
  | "CTA Test" | "Topic Test" | "Platform Test" | "Visual Style Test";

export type ExperimentResult = "Successful" | "Neutral" | "Failed" | "Needs More Data";

export type RepurposeTrigger =
  | "High saves" | "High shares" | "High comments"
  | "Strong conversion activity" | "Strong emotional response" | "Strong educational value";

export type RepurposeAction =
  | "Turn into carousel" | "Turn into newsletter" | "Turn into podcast segment"
  | "Turn into blog post" | "Turn into short-form video" | "Turn into LinkedIn thought piece"
  | "Turn into training example" | "Turn into client-facing case study";

export interface ContentPost {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  topicCategory: TopicCategory;
  hookType: HookType;
  tone: string;
  ctaType: string;
  datePosted: string;
  timePosted: string;
  reach: number;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTime?: number;
  engagementRate: number;
  conversionFlag: boolean;
  notes?: string;
  whyItWorked?: string;
  status: PostStatus;
}

export interface AudienceInsight {
  id: string;
  platform: Platform;
  ageRange: string;
  location: string;
  activeTime: string;
  behaviorTag: BehaviorTag;
  commonComment: string;
  painPoint: string;
  repeatedQuestion: string;
  relatedPostId?: string;
}

export interface CommunityInteraction {
  id: string;
  platform: Platform;
  interactionType: InteractionType;
  userName: string;
  messageSummary: string;
  leadFlag: boolean;
  followUpNeeded: boolean;
  followUpStatus: FollowUpStatus;
  relatedContent?: string;
  date: string;
  notes?: string;
}

export interface Conversion {
  id: string;
  sourcePlatform: Platform;
  relatedContentId?: string;
  conversionType: ConversionType;
  conversionValue: number;
  date: string;
  status: ConversionStatus;
  notes?: string;
}

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  testType: TestType;
  variable: string;
  startDate: string;
  endDate?: string;
  relatedPosts: string[];
  result?: ExperimentResult;
  insight?: string;
  nextMove?: string;
}

export interface RepurposeRecommendation {
  id: string;
  postId: string;
  postTitle: string;
  platform: Platform;
  trigger: RepurposeTrigger;
  recommendation: RepurposeAction;
  priority: "High" | "Medium" | "Low";
  score: number;
}
