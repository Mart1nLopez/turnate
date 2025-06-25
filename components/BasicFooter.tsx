export default function Footer() {
  return (
    <footer>
      <div className="py-4 border-t border-border text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Turnate. Todos los derechos reservados.
      </div>
    </footer>
  );
}
