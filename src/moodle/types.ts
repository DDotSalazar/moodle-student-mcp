export interface SiteInfo {
  sitename: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  userid: number;
  release: string;
  version: string;
}

export interface Course {
  id: number;
  fullname: string;
  shortname: string;
  summary?: string;
  startdate: number;
  enddate: number;
  progress?: number | null;
  lastaccess?: number;
  hidden?: boolean;
}

export interface CourseSection {
  id: number;
  name: string;
  summary: string;
  visible: number;
  modules: CourseModule[];
}

export interface CourseModule {
  id: number;
  name: string;
  modname: string;
  url?: string;
  description?: string;
  contents?: ModuleContent[];
}

export interface ModuleContent {
  type: string;
  filename: string;
  filepath: string;
  filesize: number;
  fileurl?: string;
  timecreated?: number;
  timemodified?: number;
}

export interface Assignment {
  id: number;
  cmid: number;
  course: number;
  name: string;
  intro: string;
  duedate: number;
  allowsubmissionsfromdate: number;
  gradingduedate: number;
  cutoffdate: number;
  grade: number;
}

export interface AssignmentsResponse {
  courses: Array<{
    id: number;
    fullname: string;
    shortname: string;
    assignments: Assignment[];
  }>;
}

export interface SubmissionStatus {
  lastattempt?: {
    submission?: {
      id: number;
      status: string;
      timemodified: number;
    };
    gradingstatus?: string;
  };
  feedback?: {
    grade?: { grade: string };
    gradefordisplay?: string;
    gradeddate?: number;
  };
}

export interface GradeItem {
  itemname: string;
  itemtype: string;
  gradeformatted: string;
  graderaw: number | null;
  grademax: number;
  percentageformatted: string;
  feedback: string;
  weightformatted?: string;
}

export interface GradeReportResponse {
  usergrades: Array<{
    courseid: number;
    courseidnumber?: string;
    userid: number;
    userfullname: string;
    gradeitems: GradeItem[];
  }>;
}

export interface CalendarEvent {
  id: number;
  name: string;
  description: string;
  eventtype: string;
  timestart: number;
  timeduration: number;
  courseid?: number;
  course?: { id: number; fullname: string };
}

export interface UpcomingViewResponse {
  events: CalendarEvent[];
}

export interface ActionEvent {
  id: number;
  name: string;
  description: string;
  modulename?: string;
  instance?: number;
  timestart: number;
  course?: { id: number; fullname: string; shortname: string };
  action?: {
    name: string;
    url: string;
    itemcount: number;
    actionable: boolean;
  };
}

export interface ActionEventsResponse {
  events: ActionEvent[];
}

export interface Quiz {
  id: number;
  course: number;
  coursemodule: number;
  name: string;
  intro: string;
  timeopen: number;
  timeclose: number;
  timelimit: number;
  attempts: number;
  grade: number;
}

export interface QuizzesResponse {
  quizzes: Quiz[];
}

export interface QuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  state: string;
  timestart: number;
  timefinish: number;
  sumgrades: number | null;
}

export interface QuizAttemptsResponse {
  attempts: QuizAttempt[];
}

export interface MoodleErrorBody {
  exception: string;
  errorcode: string;
  message: string;
  debuginfo?: string;
}
