(() => {
  const key = 'hana_student_tools_unlocked';
  if (sessionStorage.getItem(key) !== 'true') {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.replace('/student-tools/?next=' + next);
  }
})();
