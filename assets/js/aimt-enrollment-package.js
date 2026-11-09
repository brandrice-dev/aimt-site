// Presentation only. The existing checkout response owns bonus eligibility.
(function(){
 'use strict';
 const name=document.getElementById('enrollPackageName');
 const founder=document.getElementById('enrollFounderPackage');
 if(!name||!founder)return;
 function render(confirmed){
  const included=confirmed===true;
  name.textContent=included?'Head Spa Head Start Bonus Package':'Your course + included bonus';
  founder.hidden=!included;
 }
 window.AIMTEnrollmentPackage={render};
 render(false);
})();
