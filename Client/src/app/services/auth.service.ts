import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AuthRespones } from '../Models/AuthRespones';
import { Register } from '../Models/Register';
import { Login } from '../Models/login';
import { User } from '../Models/User';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = "http://localhost:5000/api/account/";
  private httpClient = inject(HttpClient);
  private tokenKey = 'token';

  regsiterUser(data: FormData): Observable<AuthRespones> {
    return this.httpClient.post<AuthRespones>(this.baseUrl + "register", data).pipe(
      map((res) => {
        if (res.isSuccess) {
          localStorage.setItem(this.tokenKey, res.tokens);
          this.me().subscribe(); // كده تمام، مش محتاج inject لنفسك
        }
        return res;
      })
    );
  }

  login(data: Login): Observable<AuthRespones> {
    return this.httpClient.post<AuthRespones>(this.baseUrl + "login", data).pipe(
      map((res) => {
        if (res.isSuccess && res.tokens) {
          localStorage.setItem(this.tokenKey, res.tokens);
          this.me().subscribe(); // كده تمام، مش محتاج inject لنفسك
        }
        return res;
      })
    );
  }

  me(): Observable<User> {
    return this.httpClient.get<User>(this.baseUrl + "getUserDetails", {
      headers: {
        Authorization: `Bearer ${this.getAccessToken}`
      }
    }).pipe(
      tap((res) => {
        if (res) {
          localStorage.setItem('user', JSON.stringify(res));
        }
      })
    );
  }
  get getAccessToken(): string | null {
    if (localStorage.getItem(this.tokenKey) === null) {
      return '';
    }

    return localStorage.getItem(this.tokenKey);

  }


  isLoggedIn(): boolean {
    return !!this.getAccessToken;
  }
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user');
  }
  get currentLoggedUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

}

