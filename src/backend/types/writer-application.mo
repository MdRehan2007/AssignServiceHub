import Common "common";

module {
  public type ApplicationStatus = {
    #Pending;
    #Approved;
    #Rejected;
  };

  public type WriterApplication = {
    appId         : Common.AppId;
    applicantName : Text;
    email         : Text;
    phone         : Text;
    collegeName   : Text;
    bio           : Text;
    expertise     : [Text];
    handwritingUrl: Text;
    resumeKey     : ?Text;  // object-storage key for uploaded resume (PDF/DOC/DOCX)
    resumeUrl     : Text;
    status        : ApplicationStatus;
    appliedAt     : Common.Timestamp;
    reviewedBy    : ?Text;
    reviewNote    : Text;
    updatedAt     : Int;
  };
};
