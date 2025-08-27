import { Assignment, Course, Enrollment } from '../models/index.js';
import { AssignmentStatus, UserRoles } from '../constants.js';

export const createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueAt, maxScore, instructions } = req.body;
    
    // Verify course exists and user can create assignments for it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user can create assignments for this course
    if (req.user.role === UserRoles.INSTRUCTOR && 
        course.assignedInstructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this course' });
    }
    
    const assignment = new Assignment({
      courseId,
      title,
      description,
      dueAt: new Date(dueAt),
      maxScore: maxScore || 100,
      instructions
    });
    
    await assignment.save();
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create assignment',
      error: error.message
    });
  }
};

export const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.query;
    
    let filter = { courseId, isPublished: true };
    
    const assignments = await Assignment.find(filter)
      .populate('courseId', 'title')
      .sort({ dueAt: 1 });
    
    // If student is requesting, include their submission status
    if (studentId || req.user.role === UserRoles.STUDENT) {
      const userId = studentId || req.user._id;
      
      const assignmentsWithStatus = assignments.map(assignment => {
        const submission = assignment.submissions.find(
          sub => sub.studentId.toString() === userId.toString()
        );
        
        return {
          ...assignment.toObject(),
          submissionStatus: submission ? submission.status : AssignmentStatus.PENDING,
          submission: submission || null,
          submissions: undefined // Remove submissions array for students
        };
      });
      
      return res.json({ assignments: assignmentsWithStatus });
    }
    
    res.json({ assignments });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get assignments',
      error: error.message
    });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { text, files } = req.body;
    const studentId = req.user._id;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if due date has passed
    if (new Date() > assignment.dueAt) {
      return res.status(400).json({ message: 'Assignment deadline has passed' });
    }
    
    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      courseId: assignment.courseId,
      studentId
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    // Check if already submitted
    const existingSubmissionIndex = assignment.submissions.findIndex(
      sub => sub.studentId.toString() === studentId.toString()
    );
    
    const submission = {
      studentId,
      text,
      files: files || [],
      submittedAt: new Date(),
      status: AssignmentStatus.SUBMITTED
    };
    
    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      assignment.submissions[existingSubmissionIndex] = submission;
    } else {
      // Add new submission
      assignment.submissions.push(submission);
    }
    
    await assignment.save();
    
    res.json({
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to submit assignment',
      error: error.message
    });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { score, feedback } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user can grade this assignment
    const course = await Course.findById(assignment.courseId);
    if (req.user.role === UserRoles.INSTRUCTOR && 
        course.assignedInstructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this assignment' });
    }
    
    const submissionIndex = assignment.submissions.findIndex(
      sub => sub._id.toString() === submissionId
    );
    
    if (submissionIndex === -1) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Update submission with grade
    assignment.submissions[submissionIndex].score = score;
    assignment.submissions[submissionIndex].maxScore = assignment.maxScore;
    assignment.submissions[submissionIndex].feedback = feedback;
    assignment.submissions[submissionIndex].status = AssignmentStatus.GRADED;
    assignment.submissions[submissionIndex].gradedBy = req.user._id;
    assignment.submissions[submissionIndex].gradedAt = new Date();
    
    await assignment.save();
    
    // Award XP to student based on score
    const studentId = assignment.submissions[submissionIndex].studentId;
    const xpGained = Math.floor((score / assignment.maxScore) * 50); // Max 50 XP per assignment
    
    await Enrollment.findOneAndUpdate(
      { courseId: assignment.courseId, studentId },
      { $inc: { xp: xpGained } }
    );
    
    res.json({
      message: 'Assignment graded successfully',
      submission: assignment.submissions[submissionIndex],
      xpGained
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to grade assignment',
      error: error.message
    });
  }
};

export const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get all enrollments for the student
    const enrollments = await Enrollment.find({ studentId });
    const courseIds = enrollments.map(e => e.courseId);
    
    // Get all assignments for enrolled courses
    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      isPublished: true
    })
    .populate('courseId', 'title')
    .sort({ dueAt: 1 });
    
    // Add submission status for each assignment
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = assignment.submissions.find(
        sub => sub.studentId.toString() === studentId.toString()
      );
      
      const now = new Date();
      let status = AssignmentStatus.PENDING;
      
      if (submission) {
        status = submission.status;
      } else if (now > assignment.dueAt) {
        status = AssignmentStatus.OVERDUE;
      }
      
      return {
        ...assignment.toObject(),
        submissionStatus: status,
        submission: submission || null,
        submissions: undefined // Remove submissions array
      };
    });
    
    res.json({ assignments: assignmentsWithStatus });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get assignments',
      error: error.message
    });
  }
};
