export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="flex justify-center items-center py-5">
          <span className="text-muted-foreground text-sm">
            {currentYear} &copy; Notesly
          </span>
        </div>
      </div>
    </footer>
  );
}
