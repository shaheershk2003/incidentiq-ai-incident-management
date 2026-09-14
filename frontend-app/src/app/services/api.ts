import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import {
  Observable,
  map
} from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Api {

  private baseUrl =
    environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {
    console.log(
      'API SERVICE CREATED'
    );

    console.log(
      'API BASE URL:',
      this.baseUrl
    );
  }

  private authHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token');

    console.log(
      'JWT TOKEN EXISTS:',
      !!token
    );

    return new HttpHeaders({
      'Content-Type':
        'application/json',

      'Cache-Control':
        'no-cache',

      'Pragma':
        'no-cache',

      ...(token
        ? {
            Authorization:
              `Bearer ${token}`
          }
        : {})
    });
  }

  login(
    email: string,
    password: string
  ): Observable<any> {

    console.log(
      'LOGIN REQUEST'
    );

    return this.http.post(
      `${this.baseUrl}/auth/login`,
      {
        email,
        password
      }
    );
  }

  getIncidents(): Observable<any[]> {

    return this.http
      .get<{
        success: boolean;
        incidents: any[];
      }>(
        `${this.baseUrl}/incidents`,
        {
          headers:
            this.authHeaders()
        }
      )
      .pipe(
        map(
          response =>
            response.incidents || []
        )
      );
  }

  getIncident(
    id: number
  ): Observable<any> {

    console.log(
      `API: GET /incidents/${id}`
    );

    const params =
      new HttpParams().set(
        '_t',
        Date.now().toString()
      );

    return this.http.get(
      `${this.baseUrl}/incidents/${id}`,
      {
        headers:
          this.authHeaders(),
        params
      }
    );
  }

  createIncident(
    data: any
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/incidents`,
      data,
      {
        headers:
          this.authHeaders()
      }
    );
  }

  updateIncidentStatus(
    id: number,
    status: string
  ): Observable<any> {

    console.log(
      `API: PUT /incidents/${id}/status`
    );

    console.log(
      'STATUS:',
      status
    );

    return this.http.put(
      `${this.baseUrl}/incidents/${id}/status`,
      {
        status
      },
      {
        headers:
          this.authHeaders()
      }
    );
  }

  assignIncident(
    id: number,
    assignedTo: number
  ): Observable<any> {

    console.log(
      `API: PUT /incidents/${id}/assign`
    );

    return this.http.put(
      `${this.baseUrl}/incidents/${id}/assign`,
      {
        assignedTo
      },
      {
        headers:
          this.authHeaders()
      }
    );
  }

  getUsers(): Observable<any[]> {

    console.log(
      'API: GET /users'
    );

    return this.http
      .get<{
        success: boolean;
        users: any[];
      }>(
        `${this.baseUrl}/users`,
        {
          headers:
            this.authHeaders()
        }
      )
      .pipe(
        map(
          response =>
            response.users || []
        )
      );
  }

  getComments(
    id: number
  ): Observable<any[]> {

    return this.http
      .get<{
        success: boolean;
        comments: any[];
      }>(
        `${this.baseUrl}/incidents/${id}/comments`,
        {
          headers:
            this.authHeaders()
        }
      )
      .pipe(
        map(
          response =>
            response.comments || []
        )
      );
  }

  addComment(
    id: number,
    comment: string
  ): Observable<any> {

    console.log(
      `API: POST /incidents/${id}/comments`
    );

    return this.http.post(
      `${this.baseUrl}/incidents/${id}/comments`,
      {
        commentText: comment
      },
      {
        headers:
          this.authHeaders()
      }
    );
  }

  getActivity(
    id: number
  ): Observable<any[]> {

    return this.http
      .get<{
        success: boolean;
        activities: any[];
      }>(
        `${this.baseUrl}/incidents/${id}/activity`,
        {
          headers:
            this.authHeaders()
        }
      )
      .pipe(
        map(
          response =>
            response.activities || []
        )
      );
  }

  analyzeIncident(
    id: number
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/incidents/${id}/analyze`,
      {},
      {
        headers:
          this.authHeaders()
      }
    );
  }

  runAgent(
    id: number
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/incidents/${id}/agent/run`,
      {},
      {
        headers:
          this.authHeaders()
      }
    );
  }
}