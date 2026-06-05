module {
  public type AppStatus = { #pending; #approved; #rejected };

  public type WriterApplication = {
    id : Text;
    applicantId : Principal;
    name : Text;
    email : Text;
    phone : Text;
    qualification : Text;
    experience : Text;
    subjects : [Text];
    resumeUrl : Text;
    status : AppStatus;
    reviewNote : Text;
    reviewedBy : ?Principal;
    createdAt : Int;
    updatedAt : Int;
  };
};
