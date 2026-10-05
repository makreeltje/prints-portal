Gebruikers (`/users`, admin only) manages who can sign in and with which role.

**Anatomy.** Table: Gebruiker (avatar), Rol (Select: Admin, Editor, User), Herkomst badge (Lokaal or Authentik), actions Wachtwoord resetten (local users only), Verwijderen (ConfirmDialog naming the user). The primary button "Gebruiker maken" opens a dialog (name or e-mail, Rol, Tijdelijk wachtwoord). Role changes save immediately; you cannot remove or demote the last Admin (the control is disabled with the help "Er moet minstens één Admin blijven."). **Phone:** cards with actions underneath.

**Tokens.** Table, Avatar, Badge, Select, Dialog tokens.

**States.** Loading, default, saving role, error toast, last-admin guard.

**Accessibility.** Table headers with scope; destructive actions confirm; icon buttons carry labels.

**Dutch copy.** Gebruikers | Gebruiker maken | Rol | Herkomst | Lokaal | Authentik | Wachtwoord resetten | Verwijderen | Tijdelijk wachtwoord | Er moet minstens één Admin blijven.
