import { Component, inject, Inject, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { ValidationError } from '../Models/validation-error';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-register',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, FormsModule, MatIconModule, NgIf, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  profilePicture: string = 'register.png';
  amg = 'undraw_happy-announcement_23nf.png'
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  form !: FormGroup;
  router = inject(Router)
  errors!: ValidationError[]

  passwordVisible = false;

  snackBar = inject(MatSnackBar);
  pic: any;

  togglePassword(event: Event) {
    event.preventDefault(); // ده اللي يمنع الفورم من الإرسال
    this.passwordVisible = !this.passwordVisible;
  }

  hide(): boolean {
    return this.passwordVisible;
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ profilePicture: file });
      this.form.get('profilePicture')?.updateValueAndValidity();
    }
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      UserName: ['', [Validators.required, Validators.pattern("^[a-zA-Z0-9]+$")]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', [Validators.required]],
      profilePicture: ['', [Validators.required]]
    });

  }
  register() {
    const formData = new FormData();

    formData.append('email', this.form.get('email')?.value);
    formData.append('UserName', this.form.get('UserName')?.value);
    formData.append('password', this.form.get('password')?.value);
    formData.append('fullName', this.form.get('fullName')?.value);
    formData.append('profileImage', this.form.get('profilePicture')?.value);

    this.auth.regsiterUser(formData).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.router.navigate(['/']);
          console.log(res.tokens);
          console.log(res.message);
          this.snackBar.open(res.message, 'Close', {
            duration: 2000,
            panelClass: ['mat-toolbar', 'mat-primary'],
          });
        }
      },
      error: (er) => {
        if (er.status == 400) {
          this.errors = er.error;
          console.log(this.errors);
          console.log(er.message);
          this.snackBar.open(er.message, 'Close', {
            duration: 2000,
            panelClass: ['mat-toolbar', 'mat-warn'],
          });
        }
      },
    });
  }

}
