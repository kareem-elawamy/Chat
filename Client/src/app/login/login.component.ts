import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ValidationError } from '../Models/validation-error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  form !: FormGroup;
  router = inject(Router)
  errors!: ValidationError[]



  snackBar = inject(MatSnackBar);

  passwordVisible = false;

  togglePassword(event: Event) {
    event.preventDefault(); 
    this.passwordVisible = !this.passwordVisible;
  }

  hide(): boolean {
    return this.passwordVisible;
  }


  login() {
    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        this.router.navigate(['/'])
        console.log(res.message)
        console.log(res.tokens)

        this.snackBar.open(res.message, "OK", { duration: 3000 });


      },
      error: (er) => {
        if (er.status == 400) {
          this.errors = er.error
          console.log(this.errors)
          this.snackBar.open(er, "OK", { duration: 3000 });
        }
      },
    })
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required]

    })
  }
}
