/**
 * Komponent formularza logowania, korzystający z Reaktywnych Formularzy.
 */
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { map, startWith } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { AuthResponse } from '../model/auth-response.interface';
import { AuthUser } from '../model/auth-user.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  /**
   * Deklaracja `FormGroup`, czyli modelu formularza zawierającego elementy typu `FormControl`
   * Każdy z `FormControl` przyjmuje jako argumenty konstruktora kolejno:
   * - wartość początkową
   * - tablicę walidatorów, czyli funkcji narzucających pewne ograniczenia na wartości danego pola
   * Wbudowane walidatory dostępne są pod obiektem `Validators`
   */
  public formGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  /**
   * Strumień mapujący zmiany statusu w formularzu na informację o tym, czy wartości w całym formularzu są prawidłowe;
   * Wykorzystywany jest jako strumień typu `boolean` służący do włączania bądź wyłączania przycisku wysyłającego formularz.
   */
  public buttonDisabled$ = this.formGroup.statusChanges.pipe(
    map((status) => status === 'INVALID'),
    startWith(true),
  );

  /**
   * Strumień wiadomości (_hints_) informujących użytkownika o tym jaki błąd popełnił podczas wypełniania formularza.
   * Wykorzystuje on strumień zmian wartości formularza, który jest następnie mapowany na konkretne wiadomości do wyświetlenia.
   */
  public emailMessage$ = this.formGroup.valueChanges.pipe(
    map((value) => {
      const emailErrors = this.formGroup.controls.email?.errors;
      if (emailErrors) {
        if (emailErrors?.required) {
          return 'This filed is required';
        }
        if (emailErrors?.email) {
          return 'Wrong email format';
        }
      }
      return '';
    }),
  );

  /**
   * Strumień wiadomości dotyczących pola z hasłem, zachowujący się analogicznie do wiadomości o adresie email.
   */
  public passwordMessage$ = this.formGroup.valueChanges.pipe(
    map((value) => {
      const passwordErrors = this.formGroup.controls.password?.errors;
      if (passwordErrors && this.formGroup.controls.password?.dirty) {
        if (passwordErrors.required) {
          return 'Password is required';
        }
        if (passwordErrors.minlength) {
          return 'Password should have at least 8 characters';
        }
        return '';
      } else {
        return '';
      }
    }),
  );

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    /**
     * Przykładowe wykorzystanie strumieni z `FormGroup` z przypisaniem do zmiennych pomocniczych.
     */
    const valueChanges$ = this.formGroup.valueChanges;
    const statusChanges$ = this.formGroup.statusChanges;

    /**
     * Wywołanie metody `subscribe` na obiekcie strumienia,
     * pozwala na zasubskrybowanie się na nowe wydarzenia występujące w danym strumieniu.
     */
    statusChanges$.subscribe((status) => {});
  }

  /**
   * Wywoływana z poziomu szablonu metoda `onSubmit`, która wysyła zapytanie do serwera poprzez Serwis Autoryzacji.
   * Wykonanie zapytania zwraca obiekt typu `Observable`, następnie następuje subskrypcja na wydarzenia emitowane przez ten strumień.
   * W przypadku wystąpienia błędu wyświetlana jest notyfikacja informująca o błędzie,
   * natomiast w przypadku kiedy w odpowiedzi zostanie zwrócony Token autoryzacyjny, użytkownik jest przekierowywany na podstronę ustawień.
   */
  public onSubmit($event) {
    if (this.formGroup.valid) {
      const user: AuthUser = this.formGroup.value;
      this.authService.loginUser(user).subscribe((response: AuthResponse) => {
        if (response.error) {
          this.snackBar.open('Login failed', null, {
            duration: 1000,
          });
          return;
        }

        if (response.token) {
          this.snackBar.open('Logged in!', null, {
            duration: 1000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this.router.navigateByUrl('/settings');
        }
      });
    }
  }
}
