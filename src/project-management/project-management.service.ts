import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';

// Mock project schema for project management
interface Project {
  _id: string;
  projectId: string;
  projectName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  currency: string;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  progress: {
    percentage: number;
    milestones: number;
    completedMilestones: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProjectManagementService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get project management data with pagination and filters
   */
  async getProjectManagement(page: number, limit: number, filters: any, adminId: string) {
    try {
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Mock project data - in real implementation, this would come from a projects collection
      const mockProjects: Project[] = [
        {
          _id: '1',
          projectId: 'PRO001234',
          projectName: 'Office Redesign Project',
          description: 'Complete office redesign and renovation',
          startDate: new Date('2024-12-14'),
          endDate: new Date('2025-01-14'),
          totalBudget: 10000,
          currency: 'NGN',
          status: 'in_progress',
          sponsorId: 'sponsor1',
          sponsorName: 'John Doe',
          sponsorEmail: 'john@example.com',
          vendorId: 'vendor1',
          vendorName: 'Jane Smith',
          vendorEmail: 'jane@example.com',
          progress: {
            percentage: 65,
            milestones: 5,
            completedMilestones: 3
          },
          createdAt: new Date('2024-12-14'),
          updatedAt: new Date('2024-12-14')
        },
        {
          _id: '2',
          projectId: 'PRO001234',
          projectName: 'Office Redesign Project',
          description: 'Complete office redesign and renovation',
          startDate: new Date('2024-12-14'),
          endDate: new Date('2025-01-14'),
          totalBudget: 10000,
          currency: 'NGN',
          status: 'completed',
          sponsorId: 'sponsor2',
          sponsorName: 'Mike Johnson',
          sponsorEmail: 'mike@example.com',
          vendorId: 'vendor2',
          vendorName: 'Sarah Wilson',
          vendorEmail: 'sarah@example.com',
          progress: {
            percentage: 100,
            milestones: 4,
            completedMilestones: 4
          },
          createdAt: new Date('2024-12-14'),
          updatedAt: new Date('2024-12-14')
        },
        {
          _id: '3',
          projectId: 'PRO001234',
          projectName: 'Office Redesign Project',
          description: 'Complete office redesign and renovation',
          startDate: new Date('2024-12-14'),
          endDate: new Date('2025-01-14'),
          totalBudget: 10000,
          currency: 'NGN',
          status: 'pending',
          sponsorId: 'sponsor3',
          sponsorName: 'David Brown',
          sponsorEmail: 'david@example.com',
          vendorId: 'vendor3',
          vendorName: 'Lisa Davis',
          vendorEmail: 'lisa@example.com',
          progress: {
            percentage: 0,
            milestones: 3,
            completedMilestones: 0
          },
          createdAt: new Date('2024-12-14'),
          updatedAt: new Date('2024-12-14')
        },
        {
          _id: '4',
          projectId: 'PRO001234',
          projectName: 'Office Redesign Project',
          description: 'Complete office redesign and renovation',
          startDate: new Date('2024-12-14'),
          endDate: new Date('2025-01-14'),
          totalBudget: 10000,
          currency: 'NGN',
          status: 'draft',
          sponsorId: 'sponsor4',
          sponsorName: 'Robert Taylor',
          sponsorEmail: 'robert@example.com',
          vendorId: 'vendor4',
          vendorName: 'Emma Wilson',
          vendorEmail: 'emma@example.com',
          progress: {
            percentage: 10,
            milestones: 6,
            completedMilestones: 0
          },
          createdAt: new Date('2024-12-14'),
          updatedAt: new Date('2024-12-14')
        }
      ];

      // Apply filters
      let filteredProjects = mockProjects;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(project => 
          project.projectId.toLowerCase().includes(searchTerm) ||
          project.projectName.toLowerCase().includes(searchTerm) ||
          project.sponsorName.toLowerCase().includes(searchTerm) ||
          project.vendorName.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.status) {
        filteredProjects = filteredProjects.filter(project => 
          project.status === filters.status
        );
      }

      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        
        filteredProjects = filteredProjects.filter(project => {
          const projectStartDate = new Date(project.startDate);
          const projectEndDate = new Date(project.endDate);
          
          if (startDate && projectStartDate < startDate) return false;
          if (endDate && projectEndDate > endDate) return false;
          return true;
        });
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredProjects.sort((a, b) => {
          let aValue, bValue;
          
          switch (filters.sortBy) {
            case 'name':
              aValue = a.projectName.toLowerCase();
              bValue = b.projectName.toLowerCase();
              break;
            case 'date':
              aValue = new Date(a.startDate).getTime();
              bValue = new Date(b.startDate).getTime();
              break;
            case 'budget':
              aValue = a.totalBudget;
              bValue = b.totalBudget;
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            default:
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
          }
          
          if (filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      // Get total count
      const totalItems = filteredProjects.length;
      const totalPages = Math.ceil(totalItems / limit);

      // Apply pagination
      const paginatedProjects = filteredProjects.slice(skip, skip + limit);

      // Format projects for response
      const formattedProjects = paginatedProjects.map(project => ({
        id: project._id,
        projectId: `#${project.projectId}`,
        projectName: project.projectName,
        description: project.description,
        timeline: {
          startDate: project.startDate.toISOString().split('T')[0],
          endDate: project.endDate.toISOString().split('T')[0],
          formatted: `${project.startDate.toISOString().split('T')[0].replace(/-/g, '/')} - ${project.endDate.toISOString().split('T')[0].replace(/-/g, '/')}`,
          duration: Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        totalBudget: {
          value: project.totalBudget,
          currency: project.currency,
          formatted: new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: project.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(project.totalBudget)
        },
        overallStatus: project.status,
        statusBadge: this.getStatusBadge(project.status),
        progress: project.progress,
        team: {
          sponsor: {
            id: project.sponsorId,
            name: project.sponsorName,
            email: project.sponsorEmail
          },
          vendor: {
            id: project.vendorId,
            name: project.vendorName,
            email: project.vendorEmail
          }
        },
        actions: {
          canView: true,
          canEdit: project.status !== 'completed',
          canDelete: project.status === 'draft',
          canManage: true
        }
      }));

      return {
        status: 'success',
        message: 'Project management data retrieved successfully',
        data: {
          projects: formattedProjects,
          pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            applied: filters,
            available: {
              statuses: ['draft', 'pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
              dateRanges: ['last_week', 'last_month', 'last_quarter', 'last_year']
            }
          }
        }
      };
    } catch (error) {
      console.error('Error getting project management data:', error);
      throw new BadRequestException('Failed to get project management data');
    }
  }

  /**
   * Export project management data
   */
  async exportProjectManagement(format: string, filters: any, adminId: string) {
    try {
      // In a real implementation, this would generate actual export files
      const exportData = {
        format: format,
        filters: filters,
        generatedAt: new Date().toISOString(),
        downloadUrl: `https://admin-api.sabitrack.com/exports/project-management-${Date.now()}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      return {
        status: 'success',
        message: 'Project management data export generated successfully',
        data: exportData
      };
    } catch (error) {
      console.error('Error exporting project management data:', error);
      throw new BadRequestException('Failed to export project management data');
    }
  }

  /**
   * Get project management statistics
   */
  async getProjectStatistics(filters: any, adminId: string) {
    try {
      // Mock statistics - in real implementation, this would be calculated from actual data
      const statistics = {
        totalProjects: 200,
        activeProjects: 120,
        completedProjects: 60,
        draftProjects: 15,
        pendingProjects: 5,
        totalBudget: {
          value: 2000000,
          currency: 'NGN',
          formatted: '₦2,000,000.00'
        },
        averageBudget: {
          value: 10000,
          currency: 'NGN',
          formatted: '₦10,000.00'
        },
        statusDistribution: {
          in_progress: 60,
          completed: 30,
          draft: 7.5,
          pending: 2.5
        },
        timelineStats: {
          averageDuration: 30, // days
          onTimeCompletion: 85, // percentage
          overdueProjects: 15 // count
        }
      };

      return {
        status: 'success',
        message: 'Project statistics retrieved successfully',
        data: statistics
      };
    } catch (error) {
      console.error('Error getting project statistics:', error);
      throw new BadRequestException('Failed to get project statistics');
    }
  }

  /**
   * Get status badge information
   */
  private getStatusBadge(status: string) {
    const statusConfig = {
      draft: { text: 'Draft', color: 'brown' },
      pending: { text: 'Pending', color: 'orange' },
      in_progress: { text: 'In Progress', color: 'purple' },
      completed: { text: 'Completed', color: 'green' },
      cancelled: { text: 'Cancelled', color: 'red' },
      on_hold: { text: 'On Hold', color: 'gray' }
    };

    return statusConfig[status] || { text: 'Unknown', color: 'gray' };
  }
}




