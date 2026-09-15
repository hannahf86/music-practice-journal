// app/page.tsx — entry. The route guard in providers redirects to /welcome or /home;
// this just shows a loader for the brief moment before that happens.
export default function Index() {
  return (
    <div className="loader">
      <div className="spinner" />
    </div>
  );
}
