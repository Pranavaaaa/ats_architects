// interviewSchedulerUtils.js

export const toggleInterviewer = (prevSelected, interviewerId) => ({
  ...prevSelected,
  [interviewerId]: !prevSelected[interviewerId]
});

export const handleScheduleEdit = (editableSchedule, dayIndex, interviewIndex, updatedInterview, interviewDuration) => {
  const newSchedule = [...editableSchedule];
  const startTime = new Date(updatedInterview.startTime);
  const endTime = new Date(startTime.getTime() + interviewDuration * 60000);
  
  newSchedule[dayIndex].interviews[interviewIndex] = {
    ...updatedInterview,
    startTime: startTime,
    endTime: endTime
  };
  
  return newSchedule;
};

export const formatScheduleForAPI = (editableSchedule, jobPostingId) => {
  return editableSchedule[0].interviews.map(schedule => ({
    applicationId: schedule.candidate,
    jobPostingId: jobPostingId,
    interviewerId: schedule.interviewer,
    startDateTime: schedule.startTime,
    endDateTime: schedule.endTime,
    meetingId: schedule.meetingId,
    joinUrl: schedule.joinUrl
  }));
};

export const formatEmailData = (schedules) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    console.error('Invalid or empty schedules array:', schedules);
    return [];
  }

  return schedules.map(schedule => {
    try {
      // Log incoming schedule data
      console.log('Processing schedule:', schedule);

      const interviewDate = new Date(schedule.interviewDate || schedule.startDateTime);
      const formattedDate = interviewDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Handle start time
      const startTime = new Date(schedule.startDateTime);
      const formattedStartTime = startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });

      // Handle end time
      const endTime = new Date(schedule.endDateTime);
      const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });

      const formattedTimeRange = `${formattedStartTime} to ${formattedEndTime}`;

      return {
        candidateName: schedule.candidateName || 'Candidate',
        email: schedule.candidateEmail || schedule.email,
        jobTitle: schedule.jobTitle || 'Interview',
        interviewDate: formattedDate,
        interviewTime: formattedTimeRange,
        meetingLink: schedule.joinUrl || schedule.meetingLink,
        meetingId: schedule.meetingId
      };
    } catch (error) {
      console.error('Error formatting schedule:', error, schedule);
      return null;
    }
  }).filter(Boolean); // Remove any null entries
};