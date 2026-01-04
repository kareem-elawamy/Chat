import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ValidationError } from '../Models/validation-error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgClass, NgIf } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, MatIconModule, RouterLink, NgIf, NgClass, MatButtonModule],
  templateUrl: './login.component.html',
  styles: [`
    /* Custom Input Style to override defaults */
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
export class LoginComponent implements OnInit, AfterViewInit {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  form!: FormGroup;
  errors!: ValidationError[];

  // UI States
  passwordVisible = false;
  isLoading = false;

  @ViewChild('loginCard') loginCard!: ElementRef;

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required]
    });
  }

  ngAfterViewInit() {
    // أنيميشن دخول الكارد
    gsap.from(this.loginCard.nativeElement, {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: 'power3.out'
    });
  }

  togglePassword(event: Event) {
    event.preventDefault();
    this.passwordVisible = !this.passwordVisible;
  }

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true; // تفعيل حالة التحميل

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        // أنيميشن الخروج قبل الانتقال
        gsap.to(this.loginCard.nativeElement, {
          y: -50,
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            this.router.navigate(['/']);
          }
        });

        this.snackBar.open("Welcome Back! 🚀", "Dismiss", { duration: 3000, panelClass: ['bg-green-600', 'text-white'] });
      },
      error: (er) => {
        this.isLoading = false; // إيقاف التحميل عند الخطأ
        if (er.status == 400) {
          this.errors = er.error;
          this.snackBar.open(er.error.message || "Invalid Credentials", "Retry", { duration: 3000 });
        } else {
          this.snackBar.open("Something went wrong", "Close", { duration: 3000 });
        }
      },
    });
  }
}
