import api from "./api";

export const sendThankYouEmail = async (emailData) => {
  const formData =[{
    templateName: 'THANK_YOU',
    recipients: [{ name:emailData.candidateName, email: emailData.email}],
    variables: {
      position: emailData.jobTitle
    }
  }]

  // sample data to send 
  // {
  //   "templateName": "THANK_YOU",
  //   "recipients": [
  //     {
  //       "name": "Jane Smith",
  //       "email": "janesmith@example.com"
  //     }
  //   ],
  //   "variables": {
  //     "position": "Product Manager"
  //   }
  // }

  const res = await sendEmail(formData);
  return res; 
}

export const sendInterviewScheduledEmail = async (emailDataArray) => {
  if (!Array.isArray(emailDataArray) || emailDataArray.length === 0) {
    console.error('Invalid email data array:', emailDataArray);
    throw new Error('No valid email data provided');
  }

  console.log('Sending interview scheduled emails:', emailDataArray);

  const formattedData = emailDataArray.map(emailData => ({
    templateName: 'INTERVIEW_SCHEDULED',
    recipients: [{
      name: emailData.candidateName,
      email: emailData.email
    }],
    variables: {
      candidateName: emailData.candidateName,
      position: emailData.jobTitle,
      date: emailData.interviewDate,
      time: emailData.interviewTime,
      meetingLink: emailData.meetingLink,
      meetingId: emailData.meetingId
    }
  }));

  try {
    const response = await sendEmail(formattedData);
    console.log('Email send response:', response);
    return response;
  } catch (error) {
    console.error('Error sending interview emails:', error);
    throw error;
  }
}

export const sendFinalStatusEmail = async (emailData) => {

  const formData = [{
    templateName: 'FINAL_STATUS',
    recipients: [{ name:emailData.candidateName, email: emailData.email}],
    variables: {
      position: emailData.jobTitle,
      status: emailData.status
    }
  }]
  const res = await sendEmail(formData);
  return res;

  // {
  //   "templateName": "FINAL_STATUS",
  //   "recipients": [
  //     {
  //       "name": "Mike Johnson",
  //       "email": "mikejohnson@example.com"
  //     }
  //   ],
  //   "variables": {
  //     "position": "Data Analyst",
  //     "status": "selected"  // can be "selected", "rejected", or "onhold"
  //   }
  // }
}

export const sendAcceptanceEmail = async (candidateData) => {
  const formData = [{
    templateName: 'INTERVIEW_ACCEPTED',
    recipients: [{ 
      name: candidateData.candidateName, 
      email: candidateData.candidateEmail
    }],
    variables: {
      position: candidateData.jobTitle,
      candidateName: candidateData.candidateName
    }
  }];

  return await sendEmail(formData);
};

export const sendRejectionEmail = async (candidateData) => {
  const formData = [{
    templateName: 'INTERVIEW_REJECTED',
    recipients: [{ 
      name: candidateData.candidateName, 
      email: candidateData.candidateEmail
    }],
    variables: {
      position: candidateData.jobTitle,
      candidateName: candidateData.candidateName
    }
  }];

  return await sendEmail(formData);
};

export const sendEmail = async (formData) => {
  try {
    const response = await api.post('/google/send-emails', formData);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};