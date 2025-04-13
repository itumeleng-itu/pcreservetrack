
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { Laptop, School, Users, Wrench } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="flex flex-col items-center text-center py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mb-6">
            Computer Lab Reservation System
          </h1>
          <p className="mt-4 text-xl text-gray-600 mb-8">
            Efficiently manage computer lab resources for students, administrators, and support staff
          </p>
          
          {isAuthenticated ? (
            <Button asChild size="lg" className="px-8">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="px-8">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link to="/auth">Create Account</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-gray-600 mt-2">Our platform serves different roles in the computer lab ecosystem</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <School className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Students</h3>
              <p className="text-center text-gray-600">
                Reserve computers in advance, report issues, and manage your bookings from any device.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Administrators</h3>
              <p className="text-center text-gray-600">
                Monitor lab usage, view analytics, and manage reservations across all facilities.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <div className="bg-amber-100 p-3 rounded-full mb-4">
                <Wrench className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Technicians</h3>
              <p className="text-center text-gray-600">
                Receive issue reports, track maintenance needs, and update computer status efficiently.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="bg-gray-50 py-16 px-4 rounded-2xl my-8">
        <div className="max-w-3xl mx-auto text-center">
          <Laptop className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join our platform today and experience seamless computer lab management.
          </p>
          {!isAuthenticated && (
            <Button asChild size="lg" className="px-8">
              <Link to="/auth">Create Your Account</Link>
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
