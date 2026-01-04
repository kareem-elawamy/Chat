import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import gsap from 'gsap';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    NgIf,
    NgClass,
    RouterLink,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styles: [`
    /* تنسيق الحقول لتجاوز ستايل المتصفح الافتراضي */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
        -webkit-text-fill-color: white !important;
        transition: background-color 5000s ease-in-out 0s;
    }
  `]
})
export class RegisterComponent implements OnInit, AfterViewInit {

  // Default Avatar Placeholder (Cyber Style)
  imagePreview: string = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  form!: FormGroup;
  passwordVisible = false;
  isSubmitting = false;

  @ViewChild('registerCard') registerCard!: ElementRef;
  @ViewChild('picInput', { static: false })
  picInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required]],
      UserName: ['', [Validators.required, Validators.pattern("^[a-zA-Z0-9]+$")]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      profilePicture: [null, [Validators.required]]
    });
  }

  ngAfterViewInit() {
    // أنيميشن ظهور الكارد
    gsap.from(this.registerCard.nativeElement, {
      duration: 1,
      scale: 0.95,
      opacity: 0,
      ease: 'power3.out'
    });
  }

  togglePassword(event: Event) {
    event.preventDefault();
    this.passwordVisible = !this.passwordVisible;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ profilePicture: file });
      this.form.get('profilePicture')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    if (this.picInput?.nativeElement) {
      this.picInput.nativeElement.click();
    }
  }


  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();

    formData.append('email', this.form.get('email')?.value);
    formData.append('UserName', this.form.get('UserName')?.value);
    formData.append('password', this.form.get('password')?.value);
    formData.append('fullName', this.form.get('fullName')?.value);
    formData.append('profileImage', this.form.get('profilePicture')?.value);

    this.auth.regsiterUser(formData).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          // أنيميشن النجاح والخروج
          gsap.to(this.registerCard.nativeElement, {
            y: -50, opacity: 0, duration: 0.5,
          });

          this.snackBar.open('Account Created Successfully! 🚀', 'Login', {
            duration: 3000,
            panelClass: ['bg-green-600', 'text-white']
          });
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.isSubmitting = false;

        // منطق التعامل مع الأخطاء (DuplicateEmail)
        if (err.status === 400) {
          const validationErrors = err.error;

          if (Array.isArray(validationErrors)) {
            validationErrors.forEach((error: any) => {
              if (error.code === 'DuplicateEmail') {
                this.form.get('email')?.setErrors({ duplicateEmail: true });
                this.snackBar.open("This email is already taken.", 'Close', { duration: 3000 });
              }
              if (error.code === 'DuplicateUserName') {
                this.form.get('UserName')?.setErrors({ duplicateUser: true });
                this.snackBar.open("Username is taken.", 'Close', { duration: 3000 });
              }
            });
          } else if (validationErrors.code === 'DuplicateEmail') {
            this.form.get('email')?.setErrors({ duplicateEmail: true });
          }
        } else {
          this.snackBar.open('Registration failed. Please try again.', 'Close', { duration: 3000 });
        }
      },
    });
  }
}
